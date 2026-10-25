"use client";
import { useEffect, useRef, useState } from "react";

// The five steps for the first launch, with the real macOS windows and a cursor pointing at the button to press.
// hot = where to click, in percent of the screenshot. Without motion (reduce motion) the steps stay put and can be stepped through.
const STEPS = [
  { img: "/tutorial/1-drag.webp", w: 900, h: 573, show: 560, hot: null as null | [number, number], drag: true,
    title: "Drag Vesper onto Applications", text: "In the window that opens, drag the Vesper icon onto the Applications folder. Then open Vesper from Applications." },
  { img: "/tutorial/2-blocked.webp", w: 664, h: 614, show: 320, hot: [30, 78] as [number, number], drag: false,
    title: "macOS says it can’t verify Vesper", text: "That is expected for a beta that is not on the App Store. Click Done. Do not click Move to Bin." },
  { img: "/tutorial/3-settings.webp", w: 900, h: 676, show: 480, hot: [88, 60] as [number, number], drag: false,
    title: "Open System Settings → Privacy & Security", text: "Scroll down to the Security section. Next to “Vesper was blocked”, click Open Anyway." },
  { img: "/tutorial/4-open-anyway.webp", w: 414, h: 542, show: 250, hot: [50, 80] as [number, number], drag: false,
    title: "Click Open Anyway again", text: "A last question appears. Choose Open Anyway." },
  { img: "/tutorial/5-confirm.webp", w: 424, h: 514, show: 250, hot: [50, 76] as [number, number], drag: false,
    title: "Confirm with Touch ID or your password", text: "Vesper opens. You only do this once. After that it opens like any other app." },
];

export default function OpenTutorial() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const still = useRef(false);

  useEffect(() => {
    still.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still.current) setAuto(false);
  }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setI((n) => (n + 1) % STEPS.length), 5200);
    return () => clearTimeout(t);
  }, [i, auto]);

  const s = STEPS[i];
  const go = (n: number) => { setAuto(false); setI((n + STEPS.length) % STEPS.length); };

  return (
    <div className="tut" role="group" aria-roledescription="carousel" aria-label="How to open Vesper the first time">
      <div className="tut-stage">
        <div className="tut-shot" style={{ width: `min(100%, ${s.show}px, calc((min(400px, 46svh) - 28px) * ${(s.w / s.h).toFixed(4)}))`, aspectRatio: `${s.w} / ${s.h}` }} key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.img} width={s.w} height={s.h} alt={`Step ${i + 1}: ${s.title}`} />
          {s.drag && <img className="tut-ghost" src="/tutorial/icon.webp" width={108} height={108} alt="" aria-hidden="true" />}
          {s.hot && (
            <span className="tut-hot" style={{ left: `${s.hot[0]}%`, top: `${s.hot[1]}%` }} aria-hidden="true">
              <i />
              <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L9.8 19z" fill="#fff" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            </span>
          )}
        </div>
      </div>
      <p className="tut-count">Step {i + 1} of {STEPS.length}</p>
      <h3 className="tut-title">{s.title}</h3>
      <p className="tut-text">{s.text}</p>
      <div className="tut-nav">
        <button type="button" onClick={() => go(i - 1)} aria-label="Previous step">‹</button>
        <span className="tut-dots">
          {STEPS.map((_, n) => <button key={n} type="button" className={n === i ? "on" : ""} aria-label={`Step ${n + 1}`} aria-current={n === i} onClick={() => go(n)} />)}
        </span>
        <button type="button" onClick={() => go(i + 1)} aria-label="Next step">›</button>
      </div>
    </div>
  );
}
