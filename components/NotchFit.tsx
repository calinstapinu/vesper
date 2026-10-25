"use client";
import { useLayoutEffect, useRef } from "react";

// Lays the notch out at its design width (640) and scales it down to whatever room the page gives it.
export default function NotchFit({ children, width = 640, maxScale = 1, className = "" }: { children: React.ReactNode; width?: number; maxScale?: number; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const w = wrap.current!, n = inner.current!;
    const fit = () => {
      const s = Math.min(maxScale, w.clientWidth / width);
      n.style.transform = `scale(${s})`;
      w.style.height = `${n.offsetHeight * s}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w); ro.observe(n);
    return () => ro.disconnect();
  }, [width, maxScale]);
  return (
    <div ref={wrap} className={`nfit ${className}`}>
      <div ref={inner} className="nfit-in" style={{ width }}>{children}</div>
    </div>
  );
}
