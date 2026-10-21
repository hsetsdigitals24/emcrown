// Shared preview dimensions: CSS viewport widths are independent of the available editor space.
export const PREVIEW_WIDTH = { min: 320, max: 1920, mobile: 390, tablet: 768, desktop: 1440 } as const;
export function clampPreviewWidth(width: number) {
  return Math.min(PREVIEW_WIDTH.max, Math.max(PREVIEW_WIDTH.min, Math.round(Number.isFinite(width) ? width : PREVIEW_WIDTH.mobile)));
}
