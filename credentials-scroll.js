(function () {
  const track = document.querySelector('.credentials-track');
  if (!track) return;

  const stage = track.querySelector(".quality-credentials");
  const buttons = Array.from(track.querySelectorAll('.credentials-options button'));
  const images = Array.from(track.querySelectorAll(".credentials-image img"));
  const motion = matchMedia('(min-width: 901px) and (min-height: 580px) and (prefers-reduced-motion: no-preference)');
  let active = 0;
  let frame = 0;

  function select(index) {
    if (active === index) return;
    active = index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    images.forEach((image, i) => {
      image.classList.toggle('is-active', i === index);
      image.setAttribute('aria-hidden', String(i !== index));
    });
  }

  function update() {
    frame = 0;
    track.classList.toggle('is-scroll-driven', motion.matches);
    if (!motion.matches) return;

    const distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
    const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
    select(Math.min(buttons.length - 1, Math.floor(progress * buttons.length)));
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (!motion.matches) {
        select(index);
        return;
      }
      const distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
      const start = track.getBoundingClientRect().top + scrollY;
      window.scrollTo({top: start + distance * (index + .5) / buttons.length, behavior: 'smooth'});
    });
  });

  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
  update();
})();
