"use client";
import { useEffect, useRef } from "react";

// Two CSS variables from scroll position. --sp (whole page, 0..1) lives on the progress bar alone, so a scroll tick
// restyles one element instead of the whole document. --hp (hero, 0..1) is on the root because the nav reads it too, but it
// stops changing once the hero has scrolled away, so it is written only during the first screen.
export default function ScrollFX() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement, el = bar.current!;
    let raf = 0, lastHp = -1, lastSp = -1;
    const run = () => {
      raf = 0;
      const max = root.scrollHeight - innerHeight;
      const sp = max > 0 ? Math.min(1, scrollY / max) : 0;
      if (Math.abs(sp - lastSp) > 0.001) { lastSp = sp; el.style.setProperty("--sp", sp.toFixed(4)); }
      const hp = Math.min(1, scrollY / (innerHeight * 0.9));
      if (hp !== lastHp && (hp < 1 || lastHp < 1)) { lastHp = hp; root.style.setProperty("--hp", hp.toFixed(3)); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
  }, []);
  return <div className="progress" aria-hidden="true" ref={bar} />;
}
