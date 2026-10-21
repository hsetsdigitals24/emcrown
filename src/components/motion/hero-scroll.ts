// Client helper: cached geometry and transform-only movement keep the hero scroll work bounded.
import gsap from "gsap";
import { createHeroOverlay } from "@/components/motion/hero-overlay";
const INITIAL_SCALE = 0.4;
type Geometry = { width: number; height: number; top: number; left: number; copyHeight: number };
function measure(stage: HTMLElement, track: HTMLElement, copy: HTMLElement): Geometry {
  return { width: stage.clientWidth, height: stage.clientHeight, top: track.offsetTop, left: copy.offsetLeft, copyHeight: copy.offsetHeight };
}
export function animateHero(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>(".hero-stage");
  const frame = root.querySelector<HTMLElement>(".hero-media");
  const track = root.querySelector<HTMLElement>(".hero-copy-track");
  const copy = root.querySelector<HTMLElement>(".hero-copy");
  if (!stage || !frame || !track || !copy) return;
  const overlay = createHeroOverlay(copy);
  let geometry = measure(stage, track, copy);
  const state = { scale: INITIAL_SCALE, mediaY: geometry.height * 0.3, copyY: 0 };
  const scaleX = gsap.quickSetter(frame, "scaleX");
  const scaleY = gsap.quickSetter(frame, "scaleY");
  const mediaY = gsap.quickSetter(frame, "y", "px");
  const copyY = gsap.quickSetter(track, "y", "px");
  const render = () => {
    scaleX(state.scale); scaleY(state.scale); mediaY(state.mediaY); copyY(state.copyY);
    const left = geometry.width * (1 - state.scale) / 2 - geometry.left;
    const top = geometry.height * (1 - state.scale) / 2 + state.mediaY - geometry.top - state.copyY;
    overlay.style.setProperty("--mask-left", `${left}px`);
    overlay.style.setProperty("--mask-right", `${left + geometry.width * state.scale}px`);
    overlay.style.setProperty("--mask-top", `${top}px`);
    overlay.style.setProperty("--mask-bottom", `${top + geometry.height * state.scale}px`);
  };
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: stage, start: "top top", end: () => `+=${Math.max(720, stage.clientHeight)}`, pin: true,
    scrub: 0.45, invalidateOnRefresh: true,
    onRefreshInit: () => { geometry = measure(stage, track, copy); },
  } });
  addHeroTweens(timeline, stage, state, () => geometry, render);
  render();
  return () => { overlay.remove(); gsap.set([frame, track], { clearProps: "transform" }); };
}
function addHeroTweens(timeline: gsap.core.Timeline, stage: HTMLElement, state: { scale: number; mediaY: number; copyY: number }, geometry: () => Geometry, render: () => void) {
  timeline.fromTo(state, { scale: INITIAL_SCALE, mediaY: () => geometry().height * 0.3, copyY: 0 }, {
    scale: 1, mediaY: 0, copyY: () => Math.max(0, (geometry().height - geometry().copyHeight) / 2 - geometry().top),
    duration: 1, ease: "none", onUpdate: render,
  }, 0);
  timeline.fromTo(stage.querySelector(".hero-media-shade"), { opacity: 0.12 }, { opacity: 0.82, duration: 0.8, ease: "none" }, 0);
  timeline.to(stage.querySelector(".hero-media"), { borderRadius: 0, duration: 0.35, ease: "none" }, 0.65);
  timeline.to(stage.querySelectorAll(".hero-photo, .hero-caption"), { opacity: 0, y: 24, duration: 0.25 }, 0);
}
