"use client";
import { useEffect, useRef, useState } from "react";
import Notch, { type Tab } from "./Notch";
import NotchFit from "./NotchFit";

const FEATURES: { id: Tab; name: string; text: string }[] = [
  { id: "timeline", name: "Timeline", text: "Macro windows, news markers and your sessions around now. Zoom, then click a macro, the CPI or the kill zone." },
  { id: "weekly", name: "Weekly", text: "The week's news by day. Filter by currency and impact." },
  { id: "checklist", name: "Checklist", text: "Tick your rules, choose where an item needs it, and finish the list." },
  { id: "size", name: "Size", text: "Balance, risk and stop in. Contracts out." },
];

// The four main features as the app's own tabs. On desktop the section is pinned: scrolling steps through the tabs
// until the visitor touches the panel, then the tabs are theirs.
export default function DemoSection() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [prog, setProg] = useState(0);
  const manual = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { manual.current = true; return; }
    let raf = 0;
    const run = () => {
      raf = 0;
      const el = wrap.current!;
      if (getComputedStyle(el).position !== "relative" || el.dataset.pin !== "1") return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(0.999, -r.top / Math.max(1, r.height - innerHeight)));
      setProg(p);
      if (!manual.current) setTab(FEATURES[Math.floor(p * FEATURES.length)].id);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    addEventListener("scroll", on, { passive: true });
    run();
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", on); };
  }, []);

  const user = () => { manual.current = true; };
  const pick = (t: Tab) => { manual.current = true; setTab(t); };
  const active = FEATURES.findIndex((f) => f.id === tab);

  return (
    <div className="pin" ref={wrap} data-pin="1">
      <div className="pin-in">
        <div className="demo sec">
          <div className="demo-text">
            <h2 aria-label="Play with it.">Play with it.</h2>
            <p>This is the app&apos;s own panel, with dummy data. Tap anything. Settings and editing stay in the app.</p>
            <ul className="feat">
              {FEATURES.map((f, i) => (
                <li key={f.id}>
                  <button type="button" data-spot className={`fbtn ${f.id === tab ? "on" : ""}`} onClick={() => pick(f.id)} aria-pressed={f.id === tab}>
                    <b>{f.name}</b>
                    <span>{f.text}</span>
                    {!manual.current && i === active && <i className="fill" style={{ transform: `scaleX(${Math.min(1, Math.max(0, prog * FEATURES.length - i))})` }} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="demo-stage">
            <div className="app-wrap" data-spot>
              <NotchFit maxScale={1.32}><Notch expanded tab={tab} onTab={pick} onUser={user} /></NotchFit>
            </div>
            <p className="note">Dummy data, illustrative values.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
