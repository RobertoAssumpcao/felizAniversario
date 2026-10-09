// Um céu em Canvas: poucos pontos, resolução limitada e animações que descansam.
(() => {
  'use strict';

  class BirthdaySky {
    constructor(canvas, canAnimate) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.canAnimate = canAnimate;
      this.stars = [];
      this.sparks = [];
      this.pointer = null;
      this.frame = 0;
      this.resizeFrame = 0;
      this.activeUntil = 0;
      this.lastTrail = 0;
      this.tick = this.tick.bind(this);
      if (!this.context) return;

      this.resize();
      this.wake(8000);
      window.addEventListener('resize', () => {
        if (this.resizeFrame) return;
        this.resizeFrame = requestAnimationFrame(() => {
          this.resizeFrame = 0;
          this.resize();
          this.wake(500);
        });
      }, { passive: true });
    }

    resize() {
      this.width = document.documentElement.clientWidth;
      this.height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // A mesma semente mantém o desenho estável quando a janela muda de tamanho.
      let seed = 910;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const count = Math.max(36, Math.min(110, Math.round(this.width * this.height / 12500)));
      this.stars = Array.from({ length: count }, () => ({
        x: random(), y: random(), radius: .5 + random() * 1.1,
        depth: .3 + random() * .7, phase: random() * Math.PI * 2
      }));
      this.draw(0, false);
    }

    wake(duration = 1200) {
      if (!this.context || !this.canAnimate()) return;
      this.activeUntil = Math.max(this.activeUntil, performance.now() + duration);
      if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    }

    tick(now) {
      this.frame = 0;
      if (!this.canAnimate()) { this.stop(); return; }
      this.draw(now, true);
      if (now < this.activeUntil || this.sparks.length) {
        this.frame = requestAnimationFrame(this.tick);
      }
    }

    setPointer(x, y) {
      if (!this.context || !this.canAnimate()) return;
      const previous = this.pointer;
      this.pointer = { x, y };
      const now = performance.now();
      if (previous && now - this.lastTrail > 75 && Math.hypot(x - previous.x, y - previous.y) > 6) {
        this.lastTrail = now;
        this.addSpark(x, y, (Math.random() - .5) * 12, 15, now, 650, .9);
      }
      this.wake();
    }

    clearPointer() {
      this.pointer = null;
      this.wake(1000);
    }

    addSpark(x, y, vx, vy, born, duration, radius) {
      if (this.sparks.length >= 80) return;
      this.sparks.push({ x, y, vx, vy, born, duration, radius });
    }

    burst(x, y) {
      if (!this.context || !this.canAnimate()) return;
      const now = performance.now();
      for (let i = 0; i < 18; i += 1) {
        const angle = i / 18 * Math.PI * 2;
        const speed = 22 + (i % 4) * 13;
        this.addSpark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, now, 1400, 1 + i % 3 * .5);
      }
      this.wake(1500);
    }

    draw(now, moving) {
      const ctx = this.context;
      ctx.clearRect(0, 0, this.width, this.height);
      const time = moving ? now / 1000 : 0;
      const points = [];

      for (const star of this.stars) {
        let x = star.x * this.width + Math.sin(time * .16 + star.phase) * 3 * star.depth;
        let y = star.y * this.height + Math.cos(time * .12 + star.phase) * 2 * star.depth;
        const distance = this.pointer ? Math.hypot(x - this.pointer.x, y - this.pointer.y) : Infinity;
        const proximity = Math.max(0, 1 - distance / 130);
        if (this.pointer && distance > 1) {
          x += (this.pointer.x - x) * proximity * .06;
          y += (this.pointer.y - y) * proximity * .06;
        }
        points.push({ x, y, distance });
        const alpha = .2 + (.5 + Math.sin(time * .65 + star.phase) * .5) * .35 + proximity * .35;
        ctx.fillStyle = `rgba(210, 188, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.radius + proximity * .9, 0, Math.PI * 2);
        ctx.fill();
        if (star.radius > 1.25 || proximity > .55) {
          ctx.strokeStyle = `rgba(210, 188, 255, ${alpha * .25})`;
          ctx.lineWidth = .6;
          ctx.beginPath();
          ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }

      // Leves conexões aparecem apenas perto do cursor, sem cobrir a página.
      if (this.pointer) {
        const nearby = points.filter(point => point.distance < 150)
          .sort((a, b) => a.distance - b.distance).slice(0, 6);
        for (let i = 1; i < nearby.length; i += 1) {
          const a = nearby[i - 1];
          const b = nearby[i];
          ctx.strokeStyle = `rgba(183, 154, 255, ${(1 - b.distance / 150) * .22})`;
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      this.sparks = this.sparks.filter(spark => now - spark.born < spark.duration);
      for (const spark of this.sparks) {
        const age = (now - spark.born) / spark.duration;
        const seconds = (now - spark.born) / 1000;
        const x = spark.x + spark.vx * seconds;
        const y = spark.y + spark.vy * seconds + seconds * seconds * 8;
        ctx.fillStyle = `rgba(232, 216, 255, ${(1 - age) * .8})`;
        ctx.beginPath(); ctx.arc(x, y, spark.radius * (1 - age * .6), 0, Math.PI * 2); ctx.fill();
      }
    }

    stop() {
      cancelAnimationFrame(this.frame);
      cancelAnimationFrame(this.resizeFrame);
      this.frame = 0;
      this.resizeFrame = 0;
      this.activeUntil = 0;
      this.pointer = null;
      this.sparks = [];
      if (this.context) this.draw(0, false);
    }
  }

  window.BirthdaySky = BirthdaySky;
})();
