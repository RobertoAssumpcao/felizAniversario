(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const openButton = document.getElementById('open-letter');
  const surprise = document.getElementById('surprise');
  const ghostButton = document.getElementById('ghost-button');
  const detailButton = document.getElementById('last-detail');
  const postscript = document.getElementById('postscript');
  const weatherButton = document.getElementById('weather-button');
  const weatherNote = document.getElementById('weather-note');
  const effects = document.getElementById('effects');
  const hero = document.querySelector('.hero');
  const nightArt = document.querySelector('.night-art');
  const skyButton = document.getElementById('sky-button');
  const skyStatus = document.getElementById('sky-status');
  const effectsToggle = document.getElementById('effects-toggle');
  const wishButton = document.getElementById('make-wish');
  const wishMessage = document.getElementById('wish-message');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const activeAnimations = new Set();
  const colors = ['#B79AFF', '#C4B6DF', '#F6F0FF', '#966ABC'];
  const cardFrames = new Map();
  const keepsakeCooldowns = new WeakMap();
  let opening = false;
  let opened = false;
  let ghostTimer;
  let constellationTimer;
  let parallaxFrame = 0;
  let lastMeteor = -Infinity;
  let lastWish = -Infinity;
  let effectsEnabled = true;
  const livingSky = typeof window.BirthdaySky === 'function'
    ? new window.BirthdaySky(document.getElementById('living-sky'), canAnimate)
    : null;

  function canAnimate() {
    return effectsEnabled && !motionPreference.matches && !document.hidden;
  }

  // Sem JavaScript, a carta e os recados continuam legíveis.
  surprise.hidden = true;
  postscript.hidden = true;
  weatherNote.hidden = true;
  document.documentElement.classList.add('js-ready');
  nightArt.querySelector('.orbital-note').textContent = 'toque o céu';

  function syncEffects() {
    document.documentElement.classList.toggle('effects-paused', !effectsEnabled || motionPreference.matches);
    effectsToggle.setAttribute('aria-pressed', String(effectsEnabled));
    effectsToggle.setAttribute('aria-label', effectsEnabled ? 'Pausar efeitos' : 'Ativar efeitos');
    effectsToggle.querySelector('.effects-label').textContent = !effectsEnabled
      ? 'efeitos pausados' : motionPreference.matches ? 'efeitos reduzidos' : 'efeitos ligados';
    document.getElementById('sky-hint').textContent = !effectsEnabled
      ? 'O céu está tranquilo. As surpresas continuam por aqui.'
      : motionPreference.matches ? 'Toque nas surpresas. Seu céu está no modo tranquilo.'
      : finePointer.matches ? 'Mova o mouse ou toque no céu. Ele também está comemorando.'
      : 'Toque no céu. Ele também está comemorando.';
    if (canAnimate()) livingSky?.wake(4000);
    else cancelEffects();
  }
  effectsToggle.addEventListener('click', () => {
    effectsEnabled = !effectsEnabled;
    syncEffects();
    skyStatus.textContent = effectsEnabled ? 'Efeitos ativados, respeitando sua preferência de movimento.' : 'Efeitos pausados.';
  });

  // Efeitos usam apenas transform e opacity. Cada elemento é removido ao terminar.
  function animateElement(element, keyframes, options) {
    if (!canAnimate() || typeof element.animate !== 'function') {
      element.remove();
      return Promise.resolve();
    }
    const animation = element.animate(keyframes, options);
    activeAnimations.add(animation);
    return animation.finished.catch(() => {}).finally(() => {
      activeAnimations.delete(animation);
      element.remove();
    });
  }

  // Ilustrações existentes são preservadas quando a animação termina ou é cancelada.
  function animateDecoration(element, keyframes, duration = 650) {
    if (!canAnimate() || typeof element.animate !== 'function') return;
    const animation = element.animate(keyframes, { duration, easing: 'cubic-bezier(.2,.7,.3,1)' });
    activeAnimations.add(animation);
    void animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  }

  function createParticle(x, y, index, confetti = false) {
    const particle = document.createElement('span');
    particle.className = confetti ? 'particle confetti' : 'particle';
    particle.textContent = confetti ? '' : (index % 3 === 0 ? '✧' : '✦');
    particle.style.setProperty('--particle-color', colors[index % colors.length]);
    particle.style.setProperty('--particle-size', `${8 + (index % 4) * 3}px`);
    effects.appendChild(particle);
    return { particle, start: `translate3d(${x}px, ${y}px, 0)` };
  }

  function starBurst(origin, count = 16) {
    if (!canAnimate() || activeAnimations.size > 50) return;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 40 + (i % 5) * 15;
      const { particle, start } = createParticle(origin.x, origin.y, i, i % 3 === 0);
      const endX = origin.x + Math.cos(angle) * distance;
      const endY = origin.y + Math.sin(angle) * distance + 40;
      void animateElement(particle, [
        { transform: `${start} rotate(0deg) scale(.5)`, opacity: 0 },
        { opacity: .85, offset: .12 },
        { transform: `translate3d(${endX}px, ${endY}px, 0) rotate(${i * 30}deg) scale(.8)`, opacity: 0 }
      ], { duration: 950 + (i % 4) * 100, easing: 'cubic-bezier(.15,.65,.3,1)', delay: (i % 3) * 30 });
    }
  }

  // Efeitos curtos, sob demanda; cada meteoro desaparece ao terminar.
  function shootStar(x, y, delay = 0) {
    if (!canAnimate() || activeAnimations.size > 50) return;
    const width = document.documentElement.clientWidth;
    const distance = Math.min(180, width * .48);
    const startX = Math.max(-60, Math.min(x - distance, width - distance - 80));
    const startY = Math.max(15, y - distance * .55);
    const meteor = document.createElement('span');
    meteor.className = 'shooting-star';
    effects.appendChild(meteor);
    void animateElement(meteor, [
      { transform: `translate3d(${startX}px, ${startY}px, 0) rotate(29deg) scaleX(.3)`, opacity: 0 },
      { opacity: .85, offset: .2 },
      { transform: `translate3d(${startX + distance}px, ${startY + distance * .55}px, 0) rotate(29deg) scaleX(1)`, opacity: 0 }
    ], { duration: 850, delay, easing: 'cubic-bezier(.2,.5,.4,1)' });
  }

  function meteorShower(origin, count = 7) {
    if (!canAnimate()) return;
    livingSky?.burst(origin.x, origin.y);
    const width = document.documentElement.clientWidth;
    for (let i = 0; i < count; i += 1) {
      shootStar(width * (.15 + ((i * .19) % .72)), Math.max(40, origin.y - 160 + (i % 3) * 65), i * 140);
    }
    starBurst(origin, 18);
  }

  function pulseOrbit() {
    if (!canAnimate()) return;
    const rect = nightArt.getBoundingClientRect();
    const ring = document.createElement('span');
    ring.className = 'orbit-pulse';
    effects.appendChild(ring);
    const position = `translate3d(${rect.left + rect.width / 2 - 70}px, ${rect.top + rect.height / 2 - 70}px, 0)`;
    void animateElement(ring, [
      { transform: `${position} scale(.65)`, opacity: 0 },
      { opacity: .6, offset: .2 },
      { transform: `${position} scale(1.8)`, opacity: 0 }
    ], { duration: 850, easing: 'ease-out' });
  }

  function resetScene() {
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    nightArt.style.removeProperty('--scene-x');
    nightArt.style.removeProperty('--scene-y');
  }

  hero.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || !canAnimate() || event.pointerType !== 'mouse') return;
    livingSky?.setPointer(event.clientX, event.clientY);
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = requestAnimationFrame(() => {
      parallaxFrame = 0;
      const rect = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      nightArt.style.setProperty('--scene-x', `${(x * 7).toFixed(2)}px`);
      nightArt.style.setProperty('--scene-y', `${(y * 5).toFixed(2)}px`);
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { resetScene(); livingSky?.clearPointer(); });
  hero.addEventListener('click', (event) => {
    if (event.target.closest('button, a') || event.detail === 0) return;
    livingSky?.burst(event.clientX, event.clientY);
    shootStar(event.clientX, event.clientY);
  });
  finePointer.addEventListener('change', () => { resetScene(); livingSky?.clearPointer(); syncEffects(); });

  function revealConstellation() {
    nightArt.classList.add('is-constellation');
    skyStatus.textContent = 'Até o céu tem uma constelação chamada Gaia. ✦';
    clearTimeout(constellationTimer);
    // Sem movimento, o resultado continua visível para ser apreciado com calma.
    if (canAnimate()) constellationTimer = setTimeout(() => nightArt.classList.remove('is-constellation'), 5200);
  }

  skyButton.addEventListener('click', (event) => {
    if (performance.now() - lastMeteor < 600) return;
    lastMeteor = performance.now();
    const rect = nightArt.getBoundingClientRect();
    const x = event.detail ? event.clientX : rect.left + rect.width / 2;
    const y = event.detail ? event.clientY : rect.top + rect.height / 2;
    if (!canAnimate()) {
      revealConstellation();
    } else {
      meteorShower({ x, y }, 5);
      skyStatus.textContent = 'Uma chuva de estrelas passou pelo seu céu. ✦';
    }
  });

  async function flyGhost() {
    if (!canAnimate()) return;
    pulseOrbit();
    const rect = ghostButton.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const startX = rect.left + 8;
    const startY = Math.min(Math.max(rect.top, 25), height - 110);
    const endX = width + 75;
    const midX = Math.max(width * .65, startX + 30);
    const midY = Math.max(22, startY - 68);
    const flyer = document.createElement('div');
    flyer.className = 'flying-ghost';
    flyer.appendChild(ghostButton.querySelector('.ghost').cloneNode(true));
    effects.appendChild(flyer);
    ghostButton.style.visibility = 'hidden';

    for (let i = 0; i < 10; i += 1) {
      const t = i / 10;
      const x = startX + (endX - startX) * t;
      const y = startY - Math.sin(t * Math.PI) * 58 + 36;
      const { particle, start } = createParticle(x, y, i);
      void animateElement(particle, [
        { transform: `${start} scale(.3)`, opacity: 0 },
        { opacity: .8, offset: .18 },
        { transform: `translate3d(${x - 22}px, ${y + 24}px, 0) scale(.6)`, opacity: 0 }
      ], { duration: 480, delay: i * 55, easing: 'ease-out' });
    }

    try {
      await animateElement(flyer, [
        { transform: `translate3d(${startX}px, ${startY}px, 0) rotate(0deg)` },
        { transform: `translate3d(${midX}px, ${midY}px, 0) rotate(-12deg)`, offset: .5 },
        { transform: `translate3d(${endX}px, ${startY - 28}px, 0) rotate(14deg)` }
      ], { duration: 760, easing: 'cubic-bezier(.4,0,.35,1)' });
    } finally {
      ghostButton.style.visibility = '';
    }
  }

  function focusLetter() {
    document.getElementById('letter-title').focus({ preventScroll: true });
    surprise.scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'auto', block: 'start' });
  }

  openButton.addEventListener('click', async () => {
    if (opening) return;
    if (opened) { focusLetter(); return; }
    opening = true;
    openButton.disabled = true;
    ghostButton.disabled = true;
    try {
      await flyGhost();
    } finally {
      surprise.hidden = false;
      surprise.classList.add('is-open');
      openButton.setAttribute('aria-expanded', 'true');
      openButton.querySelector('span').textContent = 'Reler sua surpresa';
      opened = true;
      opening = false;
      openButton.disabled = false;
      ghostButton.disabled = false;
      // Aguarda o layout da carta antes de rolar e transferir o foco.
      requestAnimationFrame(focusLetter);
    }
  });

  ghostButton.addEventListener('click', () => {
    if (ghostButton.classList.contains('is-playing')) return;
    ghostButton.classList.add('is-playing');
    const rect = ghostButton.getBoundingClientRect();
    starBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, 7);
    pulseOrbit();
    revealConstellation();
    clearTimeout(ghostTimer);
    ghostTimer = setTimeout(() => ghostButton.classList.remove('is-playing'), 700);
  });

  function pawParade(origin) {
    if (!canAnimate()) return;
    for (let i = 0; i < 6; i += 1) {
      const paw = document.createElement('span');
      paw.className = 'paw-print';
      paw.innerHTML = '<svg viewBox="0 0 40 44" fill="currentColor"><ellipse cx="7" cy="17" rx="4" ry="6" transform="rotate(-25 7 17)"/><ellipse cx="16" cy="9" rx="4" ry="6"/><ellipse cx="26" cy="10" rx="4" ry="6"/><ellipse cx="34" cy="19" rx="4" ry="6" transform="rotate(25 34 19)"/><path d="M9 33C9 26 15 21 20 21s12 6 12 12c0 8-8 5-12 5S9 41 9 33Z"/></svg>';
      effects.appendChild(paw);
      const x = Math.max(8, Math.min(document.documentElement.clientWidth - 42, origin.x - 50 + i * 17));
      const y = origin.y - 5 - i * 17;
      const rotation = i % 2 ? 16 : -16;
      void animateElement(paw, [
        { transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(.6)`, opacity: 0 },
        { opacity: .65, offset: .18 },
        { transform: `translate3d(${x}px, ${y - 15}px, 0) rotate(${rotation}deg) scale(1)`, opacity: 0 }
      ], { duration: 1050, delay: i * 110, easing: 'ease-out' });
    }
  }

  document.querySelectorAll('.keepsake-trigger').forEach(button => {
    const card = button.closest('.keepsake');
    const art = button.closest('.keepsake-art');
    button.addEventListener('click', () => {
      const now = performance.now();
      if (now - (keepsakeCooldowns.get(button) ?? -Infinity) < 750) return;
      keepsakeCooldowns.set(button, now);
      document.getElementById(button.getAttribute('aria-controls')).hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const rect = art.getBoundingClientRect();
      const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      if (button.dataset.keepsake === 'universe') {
        meteorShower(origin, 4);
        animateDecoration(art, [{ scale: '1', rotate: '0deg' }, { scale: '1.1', rotate: '-5deg', offset: .4 }, { scale: '1', rotate: '0deg' }]);
      } else if (button.dataset.keepsake === 'paws') {
        pawParade(origin);
        animateDecoration(art, [{ translate: '0 0' }, { translate: '0 -8px', offset: .3 }, { translate: '0 0' }]);
      } else {
        starBurst(origin, 12);
        animateDecoration(art, [{ rotate: '0deg' }, { rotate: '-9deg', offset: .25 }, { rotate: '7deg', offset: .6 }, { rotate: '0deg' }]);
      }
    });

    const resetCard = () => {
      cancelAnimationFrame(cardFrames.get(card));
      cardFrames.delete(card);
      card.style.removeProperty('--card-rx');
      card.style.removeProperty('--card-ry');
    };
    card.addEventListener('pointermove', event => {
      if (!canAnimate() || !finePointer.matches || event.pointerType !== 'mouse') return;
      livingSky?.setPointer(event.clientX, event.clientY);
      cancelAnimationFrame(cardFrames.get(card));
      cardFrames.set(card, requestAnimationFrame(() => {
        cardFrames.delete(card);
        const rect = card.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
        card.style.setProperty('--card-rx', `${(-y * 3).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 4).toFixed(2)}deg`);
      }));
    }, { passive: true });
    card.addEventListener('pointerleave', () => { resetCard(); livingSky?.clearPointer(); });
  });

  wishMessage.textContent = 'Quando quiser, toque na estrela.';
  wishButton.addEventListener('click', () => {
    if (performance.now() - lastWish < 1800) return;
    lastWish = performance.now();
    wishButton.closest('.wish').classList.add('is-made');
    wishButton.setAttribute('aria-pressed', 'true');
    wishButton.setAttribute('aria-label', 'Enviar mais uma estrela para meu pedido');
    wishButton.querySelector('.wish-star').textContent = '✦';
    wishButton.querySelector('.wish-button-label').textContent = 'Pedido guardado. Mais uma estrela?';
    wishMessage.textContent = 'Pedido guardado nas estrelas. Que esse novo ciclo te aproxime dele. ✦';
    const rect = wishButton.getBoundingClientRect();
    meteorShower({ x: rect.left + rect.width / 2, y: rect.top + 55 }, 9);
    animateDecoration(wishButton.querySelector('.wish-star'), [
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.2) rotate(90deg)', offset: .4 },
      { transform: 'scale(1) rotate(180deg)' }
    ], 1000);
  });

  // O conteúdo permanece legível antes da observação e com JavaScript desativado.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateDecoration(entry.target, [{ opacity: .35, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], 700);
        observer.unobserve(entry.target);
      }
    }, { threshold: .18 });
    document.querySelectorAll('.keepsake, .wish, .last-detail, .closing').forEach(element => observer.observe(element));
  }

  detailButton.addEventListener('click', () => {
    if (!postscript.hidden) return;
    postscript.hidden = false;
    postscript.classList.add('revealed');
    detailButton.setAttribute('aria-expanded', 'true');
    const rect = detailButton.getBoundingClientRect();
    starBurst({ x: rect.left + rect.width / 2, y: rect.top }, 10);
    for (let i = 0; i < 3; i += 1) {
      shootStar(document.documentElement.clientWidth * (.35 + i * .18), Math.max(90, rect.top - 65 + i * 35), i * 180);
    }
  });

  function closeWeather() {
    weatherNote.hidden = true;
    weatherButton.setAttribute('aria-expanded', 'false');
  }
  weatherButton.addEventListener('click', () => {
    const show = weatherNote.hidden;
    weatherNote.hidden = !show;
    weatherButton.setAttribute('aria-expanded', String(show));
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.weather')) closeWeather();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !weatherNote.hidden) {
      closeWeather();
      weatherButton.focus({ preventScroll: true });
    }
  });

  function cancelEffects() {
    resetScene();
    livingSky?.stop();
    for (const frame of cardFrames.values()) cancelAnimationFrame(frame);
    cardFrames.clear();
    document.querySelectorAll('.keepsake').forEach(card => {
      card.style.removeProperty('--card-rx');
      card.style.removeProperty('--card-ry');
    });
    clearTimeout(ghostTimer);
    clearTimeout(constellationTimer);
    ghostButton.classList.remove('is-playing');
    nightArt.classList.remove('is-constellation');
    for (const animation of activeAnimations) animation.cancel();
    effects.replaceChildren();
  }
  motionPreference.addEventListener('change', syncEffects);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelEffects();
    else if (canAnimate()) livingSky?.wake(2500);
  });
  window.addEventListener('pagehide', cancelEffects);
  syncEffects();
})();
