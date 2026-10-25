"use client";
import { useEffect, useRef, useState } from "react";
import Notch, { type IState } from "./Notch";
import NotchFit from "./NotchFit";

type Step = { t: number; s: IState };
const LOOP = 31000;
const STEPS: Step[] = [
  { t: 0, s: "out" },
  { t: 5000, s: "session" },
  { t: 10000, s: "pink" },
  { t: 15000, s: "red" },
  { t: 20500, s: "orange" },
  { t: 26000, s: "session" },
];

// The hero: only the island (L1), cycling through its states. The first lap opens with the greeting.
export default function HeroNotch() {
  const [state, setState] = useState<IState>("greeting");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { setState("session"); return; }
    let timers: ReturnType<typeof setTimeout>[] = [];
    let first = true;
    const lap = () => {
      timers.forEach(clearTimeout); timers = [];
      let off = 0;
      if (first) { setState("greeting"); off = 4200; first = false; }
      STEPS.forEach((st) => timers.push(setTimeout(() => {
        if (st.s) setState(st.s);
      }, off + st.t)));
      timers.push(setTimeout(lap, off + LOOP));
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) lap(); else { timers.forEach(clearTimeout); timers = []; } }, { threshold: 0.05 });
    io.observe(box.current!);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="hero-notch" ref={box} aria-hidden="true" inert>
      <NotchFit maxScale={1}>
        <Notch expanded={false} forceState={state} interactive={false} />
      </NotchFit>
    </div>
  );
}
