// Client helper: viewport-bound entrances scrub both ways without changing content or document flow.
import gsap from "gsap";

function reveal(target: HTMLElement, from: gsap.TweenVars, order = () => 0) {
  const motion: { tween?: gsap.core.Tween } = {};
  const showFocused = () => {
    // Pause smoothing too, otherwise its pending frame can hide the newly focused control.
    motion.tween?.scrollTrigger?.getTween()?.pause();
    motion.tween?.progress(1);
  };
  motion.tween = gsap.fromTo(target, { opacity: 0, y: 28, ...from }, {
    opacity: 1, x: 0, y: 0, scale: 1, ease: "none",
    scrollTrigger: {
      trigger: target,
      start: () => `top ${98 - order() * 5}%`,
      end: () => `top ${62 - order() * 5}%`,
      scrub: 0.55, invalidateOnRefresh: true,
      // Keyboard focus must never land inside an invisible or displaced card.
      onUpdate: () => { if (target.contains(document.activeElement)) showFocused(); },
    },
  });
  target.addEventListener("focusin", showFocused);
  return () => target.removeEventListener("focusin", showFocused);
}

function servicePosition(card: HTMLElement) {
  const grid = card.parentElement;
  if (!grid) return { order: 0, reverse: false, columns: 1 };
  const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  const index = Array.from(grid.children).indexOf(card);
  const row = Math.floor(index / columns);
  const reverse = row % 2 === 1;
  const rowLength = Math.min(columns, grid.children.length - row * columns);
  return { order: reverse ? rowLength - 1 - index % columns : index % columns, reverse, columns };
}

function animateClosingWave(root: HTMLElement) {
  const wave = root.querySelector(".closing-wave");
  if (!wave) return;
  // Take ownership before measuring transforms, including when deferred CSS is still refreshing.
  gsap.set(wave, { animation: "none", x: 0, y: 0 });
  gsap.fromTo(wave, { xPercent: -3, rotation: -2 }, {
    xPercent: 3, rotation: 2, ease: "none",
    scrollTrigger: { trigger: wave.closest("section"), start: "top bottom", end: "bottom top", scrub: 0.55 },
  });
}

export function animateHomeSections(root: HTMLElement) {
  const cleanups: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>(".service-entry").forEach(card => {
    cleanups.push(reveal(card, {
      x: () => servicePosition(card).columns === 1 ? 48 : servicePosition(card).reverse ? 110 : -110,
    }, () => servicePosition(card).order));
  });
  root.querySelectorAll<HTMLElement>(".booking-entry, .faq-item").forEach(card => {
    cleanups.push(reveal(card, {
      // offsetLeft is unaffected by the animated transform, including during a resize.
      x: () => Math.max(80, innerWidth - card.offsetLeft), y: 0, scale: 0.65,
      transformOrigin: "right center",
    }));
  });
  const selector = ".home-section:not(.location-section) .block-heading, .physicians-grid > *, .testimonial-slideshow";
  root.querySelectorAll<HTMLElement>(selector).forEach(target => {
    // The closing heading moves independently so its booking CTA stays available.
    cleanups.push(reveal(target, {}));
  });
  root.querySelectorAll<HTMLElement>(".location-section .block-heading, .location-layout > *").forEach(target => {
    const fromRight = target.classList.contains("location-details");
    cleanups.push(reveal(target, { opacity: 0.65, x: fromRight ? 24 : -24, y: 12 }));
  });
  animateClosingWave(root);
  return () => cleanups.forEach(cleanup => cleanup());
}
