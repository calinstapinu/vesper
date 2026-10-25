"use client";
import { useEffect } from "react";

// Two CSS variables from scroll position: --sp (whole page, 0..1) and --hp (hero, 0..1). Everything else is CSS.
export default function ScrollFX() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    const run = () => {
      raf = 0;
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty("--sp", String(max > 0 ? Math.min(1, scrollY / max) : 0));
      root.style.setProperty("--hp", String(Math.min(1, scrollY / (innerHeight * 0.9))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, []);
  return <div className="progress" aria-hidden="true" />;
}
