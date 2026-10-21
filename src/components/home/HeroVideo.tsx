// Client island: defer decorative video, honour reduced motion and loop while visible.
"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { HeroContent } from "@/types/home";
export default function HeroVideo({ media }: { media: HeroContent["media"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || preference.matches || document.hidden) { video.pause(); return; }
      if (!video.src) video.src = media.video;
      void video.play().catch(() => {});
    });
    const stop = () => { if (preference.matches || document.hidden) video.pause(); };
    observer.observe(video);
    preference.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => { observer.disconnect(); preference.removeEventListener("change", stop); document.removeEventListener("visibilitychange", stop); video.pause(); };
  }, [media.video]);
  return <>
    {/* Private draft media needs the browser's session; the shared optimizer cannot forward it. */}
    <Image src={media.poster} alt="" fill loading="eager" sizes="100vw" className="hero-poster" unoptimized={media.poster.startsWith("/media/cms/")} />
    <video ref={ref} muted loop playsInline preload="none" poster={media.poster} aria-hidden="true" />
  </>;
}
