"use client";
import Script from "next/script";
import { useState } from "react";
import Notch, { type IState } from "./Notch";
import NotchFit from "./NotchFit";

const STATES: { s: Exclude<IState, "greeting" | "orange">; v: string; name: string; note: string }[] = [
  { s: "out", v: "out", name: "Out", note: "Outside your window" },
  { s: "session", v: "active", name: "Session", note: "You are in your window" },
  { s: "pink", v: "pink", name: "Your colour", note: "A custom session, like a kill zone" },
  { s: "red", v: "restricted", name: "Restricted", note: "News blackout: stand aside" },
];

// The island's own states, as buttons: press one and the island above shows exactly that state.
export default function StatusDemo() {
  const [state, setState] = useState<IState>("session");
  return (
    <>
      <Script src="/aloha-mascots.js" strategy="afterInteractive" />
      <div className="status-stage">
        <NotchFit maxScale={1.7}>
          <Notch expanded={false} forceState={state} interactive={false} />
        </NotchFit>
      </div>
      <ul className="states" role="radiogroup" aria-label="Island state">
        {STATES.map((x) => (
          <li key={x.s}>
            <button type="button" role="radio" aria-label={x.name} aria-checked={state === x.s} className={`chip ${state === x.s ? "on" : ""}`} onClick={() => setState(x.s)}>
              <aloha-mascot variant={x.v} size="168" aria-hidden="true" />
              <span>{x.note}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
