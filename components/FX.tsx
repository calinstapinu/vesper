"use client";
import { useEffect } from "react";

// Hover light, nothing that runs between pointer events:
// - the underglow beneath the notch leans toward the pointer,
// - hero candles light up near the pointer one after another, then fade,
// - the hovered card lights its outline where the pointer is,
// - buttons turn their outline ring toward the pointer.
export default function FX() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // touch screens have no hover: none of this runs there (a finger drag would only burn frames)
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const hero = document.querySelector<HTMLElement>(".hero");
    const svg = document.querySelector<SVGSVGElement>(".candles");
    const cs = svg ? [...svg.querySelectorAll<SVGGElement>("g[data-c]")] : [];
    const pos = cs.map((g) => ({ g, x: +g.dataset.x!, y: +g.dataset.y!, t: 0 as number | ReturnType<typeof setTimeout> }));
    let raf = 0, ev: PointerEvent | null = null, lit: HTMLElement | null = null;
    const mags = [...document.querySelectorAll<HTMLElement>("[data-magnet]")];
    let boxes: { b: HTMLElement; bx: number; by: number; w: number; h: number }[] = [], dirty = true;
    const markDirty = () => { dirty = true; };

    const run = () => {
      raf = 0;
      const e = ev!;
      (hero ?? document.documentElement).style.setProperty("--lean", Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 2)) * 140 + "px");

      if (svg) {
        const m = svg.getScreenCTM();
        const hr = svg.getBoundingClientRect();
        if (m && e.clientY >= hr.top && e.clientY <= hr.bottom) {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
          const R = 260;
          for (const c of pos) {
            const d = Math.hypot(c.x - p.x, c.y - p.y);
            if (d > R) continue;
            clearTimeout(c.t as ReturnType<typeof setTimeout>);
            c.g.style.setProperty("--d", (d / R * 0.22).toFixed(3) + "s");
            c.g.classList.add("on");
            c.t = setTimeout(() => c.g.classList.remove("on"), 700 + (1 - d / R) * 800);
          }
        }
      }

      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spot]") ?? null;
      if (lit && lit !== el) { lit.style.removeProperty("--sx"); lit.style.removeProperty("--sy"); lit.removeAttribute("data-hot"); }
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", e.clientX - r.left + "px");
        el.style.setProperty("--sy", e.clientY - r.top + "px");
        el.setAttribute("data-hot", "");
      }
      lit = el;

      // only the button nearest the pointer leans, and never further than half the gap, so two neighbours cannot collide
      if (dirty) {
        boxes = mags.map((b) => { const r = b.getBoundingClientRect(); return { b, bx: r.left + r.width / 2, by: r.top + r.height / 2, w: r.width, h: r.height }; });
        dirty = false;
      }
      let best: HTMLElement | null = null, bestD = Infinity, bb = boxes[0];
      for (const k of boxes) {
        const dx = Math.max(0, Math.abs(e.clientX - k.bx) - k.w / 2), dy = Math.max(0, Math.abs(e.clientY - k.by) - k.h / 2);
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = k.b; bb = k; }
      }
      const cl = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      for (const k of boxes) {
        if (k.b === best && bestD < 60) {
          k.b.style.setProperty("--ang", Math.atan2(e.clientY - k.by, e.clientX - k.bx) * 180 / Math.PI + 90 + "deg");
          k.b.style.transform = `translate(${cl((e.clientX - bb.bx) * 0.05, 4)}px, ${cl((e.clientY - bb.by) * 0.1, 4)}px)`;
        } else if (k.b.style.transform) k.b.style.transform = "";
      }
    };
    const onMove = (e: PointerEvent) => { ev = e; if (!raf) raf = requestAnimationFrame(run); };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", markDirty, { passive: true });
    addEventListener("resize", markDirty);
    return () => {
      removeEventListener("scroll", markDirty); removeEventListener("resize", markDirty); cancelAnimationFrame(raf); removeEventListener("pointermove", onMove); pos.forEach((c) => clearTimeout(c.t as ReturnType<typeof setTimeout>)); };
  }, []);
  return null;
}
