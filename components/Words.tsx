"use client";
import { useEffect, useRef } from "react";

// Heading whose words rise out of a mask one after another when it enters view. Visible without script.
export default function Words({ text, as: T = "h2", className }: { text: string; as?: "h1" | "h2"; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < innerHeight * 0.85) return;
    el.classList.add("wr");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("wr-in"); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = T as React.ElementType;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true"><span className="wm"><span style={{ transitionDelay: `${i * 70}ms` }}>{w}</span></span>{" "}</span>
      ))}
    </Tag>
  );
}
