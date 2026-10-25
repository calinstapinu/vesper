"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const ITEMS = [
  { no: "No", word: "signals", body: "Vesper never tells you what to buy or sell. Your entries stay yours." },
  { no: "No", word: "predictions", body: "No forecasts and no AI calls. It shows the clock, the news, your rules and your size." },
  { no: "No", word: "price feed", body: "No charts or quotes inside Vesper. Keep the chart you already use open." },
  { no: "Not", word: "financial advice", body: "A timing and discipline tool. Every trading decision, and its risk, is yours." },
];

// Four promises as four buttons: each strikes its word through and opens a line of detail.
export default function Nots() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLUListElement>(null);
  // the list keeps the height it has with its tallest answer open, so nothing around it moves when a card opens
  useLayoutEffect(() => {
    const ul = ref.current!;
    const fit = () => {
      const lis = [...ul.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(ul).rowGap) || 0;
      const heads = lis.map((li) => (li.querySelector("h3") as HTMLElement).offsetHeight + 2);
      const bodies = lis.map((li) => (li.querySelector(".bd p") as HTMLElement).scrollHeight + 24);
      ul.style.height = `${heads.reduce((a, b) => a + b, 0) + gap * (lis.length - 1) + Math.max(...bodies)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(ul);
    addEventListener("resize", fit);
    return () => { ro.disconnect(); removeEventListener("resize", fit); };
  }, []);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("struck"); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("struck"); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <ul className="nots2" ref={ref}>
      {ITEMS.map((it, i) => (
        <li key={it.word} className={open === i ? "on" : ""} style={{ ["--i" as string]: i }} onMouseEnter={() => setOpen(i)}>
          <h3>
            <button type="button" aria-expanded={open === i} aria-controls={`nots-${i}`} onClick={() => setOpen(open === i ? null : i)}>
              <span className="hd">{it.no} <span className="wd">{it.word}<i /></span>.</span>
              <span className="pm" aria-hidden="true" />
            </button>
          </h3>
          <div className="bd" id={`nots-${i}`}><p>{it.body}</p></div>
        </li>
      ))}
    </ul>
  );
}
