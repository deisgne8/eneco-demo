(function () {
  const track = document.querySelector('.logistics-motion-track');
  if (!track) return;

  const rail = track.querySelector('.logistics-steps');
  const cards = Array.from(rail.querySelectorAll('article'));
  const nextSection = document.querySelector('.logistics-reference-process');
  const destination = nextSection.querySelector('.reference-process-visual');
  const bridge = document.createElement('img');
  bridge.className = 'logistics-image-bridge';
  bridge.src = 'logistics-overview.jpg';
  bridge.alt = '';
  bridge.hidden = true;
  const defineImage = bridge.cloneNode();
  defineImage.src = destination.querySelector('img').src;
  const defineLine = nextSection.querySelector('.reference-process-copy article');
  document.body.append(bridge, defineImage);

  const canAnimate = matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  let lastFrame = 0;
  let stackProgress;
  const clamp = value => Math.max(0, Math.min(1, value));

  function render(timestamp) {
    frame = 0;
    const enabled = canAnimate.matches;
    track.classList.toggle('has-motion', enabled);
    nextSection.classList.toggle('has-image-handoff', enabled);
    if (!enabled) {
      stackProgress = undefined;
      lastFrame = 0;
      bridge.hidden = true;
      defineImage.hidden = true;
      nextSection.classList.remove('is-image-docked');
      rail.classList.remove('is-bridging');
      cards.forEach(card => {
        card.style.removeProperty('--step-shift');
        card.style.removeProperty('--step-opacity');
      });
      return;
    }

    const railStyle = getComputedStyle(rail);
    const distance = parseFloat(getComputedStyle(track).paddingBottom);
    const start = parseFloat(railStyle.top) - parseFloat(railStyle.marginTop);
    const stackDistance = distance * .8;
    const scrolled = start - track.getBoundingClientRect().top;
    const targetProgress = clamp(scrolled / stackDistance);
    const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 40) : 16;
    lastFrame = timestamp;
    stackProgress ??= targetProgress;
    stackProgress += (targetProgress - stackProgress) * (1 - Math.exp(-elapsed / 70));
    if (Math.abs(targetProgress - stackProgress) < .002) stackProgress = targetProgress;
    const firstLeft = cards[0].offsetLeft;
    const shifts = cards.slice(1).map(card => firstLeft - card.offsetLeft);

    cards.slice(1).forEach((card, index) => {
      const slide = clamp((stackProgress - index * .07) / .86);
      const eased = slide * slide * (3 - 2 * slide);
      const fade = clamp((slide - .72) / .28);
      card.style.setProperty('--step-shift', shifts[index] * eased + 'px');
      card.style.setProperty('--step-opacity', 1 - fade * fade * (3 - 2 * fade));
    });
    if (stackProgress !== targetProgress) requestRender();

    const lead = cards[0].getBoundingClientRect();
    const target = destination.getBoundingClientRect();
    const boundary = nextSection.getBoundingClientRect().top;
    const pin = parseFloat(getComputedStyle(destination).top);
    const handoffStart = boundary + scrolled - stackDistance;
    const handoffEnd = pin - parseFloat(getComputedStyle(nextSection).paddingTop);
    const docked = boundary <= handoffEnd;
    const bridging = !docked && boundary < handoffStart;
    bridge.hidden = !bridging;
    defineImage.hidden = !bridging;
    nextSection.classList.toggle('is-image-docked', docked);
    rail.classList.toggle('is-bridging', bridging || docked);

    if (bridging) {
      const fraction = clamp((handoffStart - boundary) / (handoffStart - handoffEnd));
      const blend = fraction * fraction * (3 - 2 * fraction);
      const mix = (from, to) => from + (to - from) * blend;
      const top = mix(lead.top, target.top);
      const height = mix(lead.height, target.height);
      const line = defineLine.getBoundingClientRect().top;
      const wipe = clamp((line - top) / height);
      const transform = 'translate3d(' + mix(lead.left, target.left) + 'px,' + top + 'px,0)';
      [bridge, defineImage].forEach(image => {
        image.style.transform = transform;
        image.style.width = mix(lead.width, target.width) + 'px';
        image.style.height = height + 'px';
      });
      defineImage.style.clipPath = 'inset(' + wipe * 100 + '% 0 0)';
    }
  }

  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender);
  canAnimate.addEventListener('change', requestRender);
  requestRender();
})();
