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
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const activeAnimations = new Set();
  const colors = ['#B79AFF', '#C4B6DF', '#F6F0FF', '#966ABC'];
  let opening = false;
  let opened = false;
  let ghostTimer;
  let constellationTimer;
  let parallaxFrame = 0;
  let lastMeteor = -Infinity;

  // Sem JavaScript, a carta e os recados continuam legíveis.
  surprise.hidden = true;
  postscript.hidden = true;
  weatherNote.hidden = true;
  document.documentElement.classList.add('js-ready');
  nightArt.querySelector('.orbital-note').textContent = 'toque o céu';

  // Poucos pontos estáticos; só a opacidade muda, por um tempo limitado.
  const sky = document.querySelector('.starfield');
  const skyFragment = document.createDocumentFragment();
  for (let i = 0; i < 18; i += 1) {
    const star = document.createElement('span');
    star.className = 'background-star';
    star.style.left = `${6 + ((i * 37) % 88)}%`;
    star.style.top = `${5 + ((i * 23) % 86)}%`;
    star.style.setProperty('--delay', `${-(i % 6)}s`);
    skyFragment.appendChild(star);
  }
  sky.appendChild(skyFragment);

  // Efeitos usam apenas transform e opacity. Cada elemento é removido ao terminar.
  function animateElement(element, keyframes, options) {
    if (motionPreference.matches || typeof element.animate !== 'function') {
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
    if (motionPreference.matches || document.hidden || activeAnimations.size > 50) return;
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

  // Efeitos curtos, sob demanda: nenhuma animação roda em loop permanente.
  function shootStar(x, y, delay = 0) {
    if (motionPreference.matches || document.hidden || activeAnimations.size > 50) return;
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

  function pulseOrbit() {
    if (motionPreference.matches || document.hidden) return;
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
    if (!finePointer.matches || motionPreference.matches || event.pointerType !== 'mouse' || document.hidden) return;
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
  hero.addEventListener('pointerleave', resetScene);
  finePointer.addEventListener('change', resetScene);

  function revealConstellation() {
    nightArt.classList.add('is-constellation');
    skyStatus.textContent = 'Até o céu tem uma constelação chamada Gaia. ✦';
    clearTimeout(constellationTimer);
    constellationTimer = setTimeout(() => nightArt.classList.remove('is-constellation'), 4200);
  }

  skyButton.addEventListener('click', (event) => {
    if (performance.now() - lastMeteor < 600) return;
    lastMeteor = performance.now();
    const rect = nightArt.getBoundingClientRect();
    const x = event.detail ? event.clientX : rect.left + rect.width / 2;
    const y = event.detail ? event.clientY : rect.top + rect.height / 2;
    if (motionPreference.matches) {
      revealConstellation();
    } else {
      shootStar(x, y);
      skyStatus.textContent = 'Uma estrela cadente passou pelo seu céu. ✦';
    }
  });

  async function flyGhost() {
    if (motionPreference.matches) return;
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
    surprise.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'start' });
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
    clearTimeout(ghostTimer);
    clearTimeout(constellationTimer);
    ghostButton.classList.remove('is-playing');
    nightArt.classList.remove('is-constellation');
    for (const animation of activeAnimations) animation.cancel();
    effects.replaceChildren();
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) cancelEffects();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelEffects();
  });
})();
