// Client helper: alternate real CSS grid rows, offset paired rows by one card's stagger.
export function observeServiceCards(grid: HTMLElement) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const cards = [...grid.querySelectorAll<HTMLElement>(".service-entry")];
  const revealed = new Set<Element>();
  const animations = new Set<Animation>();
  const play = (element: Element, frames: Keyframe[], delay: number, duration: number) => {
    const animation = element.animate(frames, { duration, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    animations.add(animation);
    animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
  };
  let columns = 1;
  const measure = () => { columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length; };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || revealed.has(entry.target)) return;
      revealed.add(entry.target);
      observer.unobserve(entry.target);
      if (preference.matches) return;
      const index = cards.indexOf(entry.target as HTMLElement);
      const row = Math.floor(index / columns);
      const column = index % columns;
      const rowLength = Math.min(columns, cards.length - row * columns);
      const reverse = row % 2 === 1;
      const order = reverse ? rowLength - 1 - column : column;
      const distance = columns === 1 ? 0 : reverse ? 72 : -72;
      const delay = (order + (reverse ? 1 : 0)) * 120;
      play(entry.target, [
        { opacity: 0, transform: `translate3d(${distance}px, 20px, 0)` },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ], delay, 650);

    });
  }, { threshold: 0.12 });
  const stop = () => { if (preference.matches) animations.forEach((animation) => animation.cancel()); };
  measure();
  cards.forEach((card) => observer.observe(card));
  const resize = new ResizeObserver(measure);
  resize.observe(grid);
  preference.addEventListener("change", stop);
  return () => { observer.disconnect(); resize.disconnect(); preference.removeEventListener("change", stop); animations.forEach((animation) => animation.cancel()); };
}
