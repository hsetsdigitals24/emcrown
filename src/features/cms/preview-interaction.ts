// Shared preview hit rule: navigation disclosures remain usable while selecting editorial content.
export function isPreviewNavigationControl(target: Element) {
  const summary = target.closest("summary");
  return Boolean(target.closest(".menu-backdrop") || summary?.matches(".navigation-mobile > summary, .navigation-disclosure > summary, .mobile-submenu > summary"));
}
