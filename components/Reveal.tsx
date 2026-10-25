"use client";
import { useEffect, useRef } from "react";

// Entrance once per element as it enters view. Content is visible without script; the hidden state is only set by this effect.
export default function Reveal({ children, className = "", delay = 0, as: T = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.9) return;
    el.classList.add("rv");
    el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("rv-in"); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  const Tag = T as React.ElementType;
  return <Tag ref={ref} className={className}>{children}</Tag>;
}
