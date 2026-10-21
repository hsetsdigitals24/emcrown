// Client helper: inert white copy lets the expanding video's edges reveal individual glyphs.
export function createHeroOverlay(copy: HTMLElement) {
  const overlay = copy.cloneNode(true) as HTMLElement;
  overlay.classList.add("hero-copy-white");
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  [overlay, ...overlay.querySelectorAll("[id], [aria-labelledby], [aria-label]")].forEach((element) => {
    element.removeAttribute("id");
    element.removeAttribute("aria-labelledby");
    element.removeAttribute("aria-label");
  });
  // Keep one semantic heading and one set of interactive controls in the document.
  overlay.querySelectorAll("h1, a").forEach((element) => {
    const replacement = document.createElement(element.tagName === "H1" ? "div" : "span");
    replacement.className = element.className;
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
  });
  copy.after(overlay);
  const originals = [copy, ...copy.querySelectorAll("*")];
  const duplicates = [overlay, ...overlay.querySelectorAll("*")];
  // If someone scrolls during the entrance, both copies retain identical word positions.
  originals.forEach((element, index) => element.getAnimations().forEach((animation) => {
    if (!(animation.effect instanceof KeyframeEffect)) return;
    const duplicate = duplicates[index]?.animate(animation.effect.getKeyframes(), animation.effect.getTiming());
    if (duplicate) duplicate.currentTime = animation.currentTime;
  }));
  return overlay;
}
