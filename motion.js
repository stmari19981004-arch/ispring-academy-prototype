(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const intro = document.querySelector('.hero-intro');
  const motionArea = document.querySelector('.result-motion');
  const result = document.querySelector('.result');
  const cursor = document.querySelector('.demo-cursor');
  const participant = document.querySelector('.participant');
  const correctAnswer = document.querySelector('[data-correct-answer]');

  if (!hero || !intro || !motionArea || !result || !cursor || !participant || !correctAnswer || reduceMotion.matches) return;

  let runToken = 0;
  let activeAnimations = [];
  let scrollFrame = 0;
  let scrollMetrics;

  const wait = (duration, token) => new Promise((resolve, reject) => {
    window.setTimeout(() => token === runToken ? resolve() : reject(new Error('cancelled')), duration);
  });

  function cancelAnimations() {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations = [];
  }

  function resetScene() {
    cancelAnimations();
    cursor.style.transform = '';
    participant.style.transform = '';
    result.classList.remove('demo-visible', 'demo-feedback', 'demo-press');
    result.classList.add('demo-reset');
  }

  async function animateTo(element, from, to, duration, easing, token) {
    const animation = element.animate(
      [{ transform: from }, { transform: to }],
      { duration, easing, fill: 'forwards' }
    );
    activeAnimations.push(animation);

    await animation.finished;
    if (token !== runToken) throw new Error('cancelled');

    element.style.transform = to;
    animation.cancel();
    activeAnimations = activeAnimations.filter(item => item !== animation);
  }

  function targetOffsets() {
    const resultRect = result.getBoundingClientRect();
    const answerRect = correctAnswer.getBoundingClientRect();
    const targetOriginX = answerRect.left - resultRect.left + 2;
    const targetOriginY = answerRect.top - resultRect.top + answerRect.height / 2 - 17;

    return {
      moveX: targetOriginX - cursor.offsetLeft,
      moveY: targetOriginY - cursor.offsetTop
    };
  }

  function measureScroll() {
    const scrollY = window.scrollY;
    const heroTop = hero.getBoundingClientRect().top + scrollY;
    const motionTop = motionArea.getBoundingClientRect().top + scrollY;
    const stickyTop = 76;
    const releaseStart = motionTop - 176;
    const naturalRelease = heroTop + hero.offsetHeight - intro.offsetHeight - stickyTop;

    scrollMetrics = { releaseStart, naturalRelease };
  }

  function updateScroll() {
    scrollFrame = 0;
    if (!scrollMetrics) measureScroll();

    const { releaseStart, naturalRelease } = scrollMetrics;
    const releaseDistance = Math.max(0, Math.min(window.scrollY - releaseStart, naturalRelease - releaseStart));
    intro.style.setProperty('--intro-shift', `${(-releaseDistance).toFixed(3)}px`);
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
  }

  async function playCycle() {
    const token = ++runToken;
    resetScene();

    try {
      await wait(700, token);
      result.classList.add('demo-visible');
      await wait(420, token);

      const { moveX, moveY } = targetOffsets();
      const actorTarget = `translate3d(${moveX}px, ${moveY}px, 0)`;

      await Promise.all([
        animateTo(cursor, 'translate3d(0, 0, 0)', actorTarget, 1550, 'cubic-bezier(.22,.72,.18,1)', token),
        animateTo(participant, 'translate3d(0, 0, 0)', actorTarget, 1550, 'cubic-bezier(.22,.72,.18,1)', token)
      ]);

      await wait(140, token);
      result.classList.add('demo-press');
      await wait(120, token);
      result.classList.remove('demo-press');
      await wait(120, token);

      result.classList.add('demo-feedback');
      await wait(1750, token);

      const actorAway = `translate3d(${moveX + 38}px, ${moveY - 10}px, 0)`;
      await Promise.all([
        animateTo(cursor, actorTarget, actorAway, 620, 'cubic-bezier(.22,.72,.18,1)', token),
        animateTo(participant, actorTarget, actorAway, 620, 'cubic-bezier(.22,.72,.18,1)', token)
      ]);
      await wait(1800, token);

      if (token === runToken) playCycle();
    } catch (error) {
      if (token === runToken) resetScene();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      runToken += 1;
      resetScene();
    } else {
      playCycle();
    }
  });

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    scrollMetrics = null;
    measureScroll();
    requestScrollUpdate();
  }, { passive: true });

  measureScroll();
  updateScroll();
  playCycle();
})();

(() => {
  const cards = Array.from(document.querySelectorAll('.learning-card'));
  if (cards.length !== 3) return;

  cards.forEach((card, index) => {
    if (card.parentElement.classList.contains('learning-card-slot')) return;

    const slot = document.createElement('div');
    slot.className = 'learning-card-slot';
    slot.style.setProperty('--stack-index', index);
    card.before(slot);
    slot.append(card);
  });
})();
