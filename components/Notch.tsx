"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHECKLIST, CURRENCIES, DAYS, EVENTS, INSTRUMENTS, SESSIONS, type Cur, type Inst } from "@/lib/demoData";

export type Tab = "timeline" | "weekly" | "size" | "checklist";
export type IState = "greeting" | "out" | "session" | "pink" | "red" | "orange";
export type Act = { k: string; n: number } | null;

const ORDER: Tab[] = ["timeline", "weekly", "size", "checklist"];
const STRIP: Record<Tab, string> = { timeline: "Timeline", weekly: "Weekly", size: "Size", checklist: "Checklist" };
const NOW0 = 9 * 3600 + 41 * 60 + 9; // 09:41:09 on the dummy New York clock, in seconds
const HOLD_MS = 1200; // the app asks for a 3 s hold; the website demo is quicker
const ZOOMS = [30, 60, 120] as const;

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clock = (s: number, sec = true) => `${pad(s / 3600)}:${pad((s % 3600) / 60)}${sec ? ":" + pad(s % 60) : ""}`;
export const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
};

// Dummy NY day in minutes since midnight, with the app's defaults: Pre-session 07:00 to 09:30, Opening 09:30 to 11:00,
// a macro around every hour (+-10 min) with Lunch (11:30 to 13:30) and Final (15:15 to 15:45) replacing the hourly ones they cover.
const WINDOWS = [{ a: 420, b: 570, name: "Pre-session" }, { a: 570, b: 660, name: "Opening" }];
const CPI = { t: 600, a: 595, b: 605 }; // High, 5+5 min blackout around the release
const KILL = { a: 615, b: 635, name: "Kill zone" }; // the user's own interval
const MACROS: { a: number; b: number; name: string }[] = [
  ...[7, 8, 9, 10, 11, 14, 16].map((h) => ({ a: h * 60 - 10, b: h * 60 + 10, name: "Macro" })),
  { a: 690, b: 810, name: "Lunch Macro" }, { a: 915, b: 945, name: "Final Macro" },
];

const MASCOT: Record<Exclude<IState, "greeting">, string> = {
  out: "out_drool", session: "session_lupa", pink: "session_lupa_pink", red: "restricted", orange: "restricted",
};

type Sel = null | string;

function Letters({ text, from }: { text: string; from: "below" | "above" }) {
  return (
    <span className={`nt-letters ${from}`} aria-label={text}>
      {[...text].map((c, i) => <span key={i} aria-hidden="true" style={{ animationDelay: `${i * 55}ms` }}>{c}</span>)}
    </span>
  );
}
const Chevron = () => <svg className="chev" width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5l3 3 3-3" /></svg>;
const Pencil = ({ onTip }: { onTip: () => void }) => (
  <button className="nt-cap sq" type="button" aria-label="Edit (available in the app)" onClick={onTip}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19z" /></svg>
  </button>
);
function Menu({ open, children, w }: { open: boolean; children: React.ReactNode; w?: number }) {
  return open ? <div className="nt-menu" role="menu" style={w ? { width: w } : undefined}>{children}</div> : null;
}

type Props = { expanded?: boolean; tab?: Tab; onTab?: (t: Tab) => void; forceState?: IState; interactive?: boolean; act?: Act; onUser?: () => void; name?: string };

export default function Notch({ expanded = true, tab = "timeline", onTab, forceState, interactive = true, act = null, onUser, name = "Trader" }: Props) {
  const [sec, setSec] = useState(0);
  const [zi, setZi] = useState(1);
  const [sel, setSel] = useState<Sel>(null);
  const [menu, setMenu] = useState<null | "cur" | "imp" | "inst" | "ses" | "list">(null);
  const [cur, setCur] = useState<Cur>("CAD");
  const [med, setMed] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({ bias: true, news: true });
  const [choice, setChoice] = useState<string | null>(null);
  const [chooseOpen, setChooseOpen] = useState(false);
  const [tip, setTip] = useState(false);
  const [tipMsg, setTipMsg] = useState("");
  const [hold, setHold] = useState<"idle" | "holding" | "done">("idle");
  const [celebrate, setCelebrate] = useState(0);
  const [inst, setInst] = useState<Inst>("MNQ");
  const [balance, setBalance] = useState("50000");
  const [risk, setRisk] = useState(0.5);
  const [stop, setStop] = useState(25);
  const root = useRef<HTMLDivElement>(null);
  const holdT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastNonSize = useRef<Tab>("timeline");

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => { clearInterval(id); if (e.isIntersecting) id = setInterval(() => setSec((s) => s + 1), 1000); }, { threshold: 0.05 });
    io.observe(root.current!);
    return () => { io.disconnect(); clearInterval(id); };
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest(".nt-menu, [data-menu]")) { setMenu(null); setChooseOpen(false); } };
    addEventListener("pointerdown", close);
    return () => removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => { if (tab !== "size") lastNonSize.current = tab; }, [tab]);

  const touch = useCallback(() => onUser?.(), [onUser]);
  const go = (t: Tab) => { onTab?.(t); touch(); };
  const showTip = (msg = "Editing is available in the app.") => { setTipMsg(msg); setTip(true); setTimeout(() => setTip(false), 2200); touch(); };

  const doneCount = CHECKLIST.filter((c) => (c.options ? !!choice : !!done[c.id])).length;
  const complete = doneCount === CHECKLIST.length;
  const prevComplete = useRef(false);
  useEffect(() => {
    if (complete && !prevComplete.current) {
      prevComplete.current = true;
      setCelebrate((c) => c + 1);
      const t = setTimeout(() => setCelebrate(0), 6000);
      return () => clearTimeout(t);
    }
    if (!complete) prevComplete.current = false;
  }, [complete]);

  const actDone = useRef(-1);
  useEffect(() => {
    if (!act || act.n === actDone.current) return;
    actDone.current = act.n;
    const [k, v] = act.k.split(":");
    if (k === "cpi") setSel("cpi");
    else if (k === "macro") setSel("macro");
    else if (k === "zoom") setZi(+v);
    else if (k === "cur") setCur(v as Cur);
    else if (k === "tick") setDone((d) => { const nx = CHECKLIST.find((c) => !c.options && !d[c.id]); return nx ? { ...d, [nx.id]: true } : d; });
    else if (k === "choose") setChoice(v);
    else if (k === "risk") setRisk((r) => Math.min(5, r + 0.5));
    else if (k === "reset") { setDone({ bias: true, news: true }); setChoice(null); setSel(null); setZi(1); setCur("CAD"); setRisk(0.5); }
  }, [act]);

  // ---- header
  const sess = SESSIONS.NY;
  const outside = !sess.inWindow;
  const state: IState = forceState ?? (outside ? "out" : "session");
  const loop = (b: number, mod: number) => { const r = (b - (sec % mod)); return r <= 0 ? r + mod : r; };
  const word = state === "out" ? "Outside" : state === "red" || state === "orange" ? "Restricted" : "Open";
  const shown = state === "out" ? (forceState ? loop(9, 9) : sess.nextIn - sec) : state === "red" || state === "orange" ? loop(30, 30) : 13 * 60 + 45 - sec;
  const pill =
    state === "pink" ? { t: "Kill zone", c: "pink" } :
    state === "red" ? { t: `CPI ${fmt(loop(30, 30))}`, c: "red pulse" } :
    state === "orange" ? { t: `PPI ${fmt(loop(30, 30))}`, c: "orange pulse" } :
    state === "out" ? { t: `CPI ${fmt(4320 - sec)}`, c: "dim" } : { t: `CPI ${fmt(1500 - sec)}`, c: "" };
  const mascotName = celebrate && state !== "greeting" ? "checklist_done" : state === "greeting" ? "out_drool" : MASCOT[state];

  // ---- timeline (now stays in the middle, time flows to the left, like the app)
  const nowS = NOW0 + sec;
  const nowM = nowS / 60;
  const half = ZOOMS[zi];
  const X = (m: number) => 50 + ((m - nowM) / half) * 50;
  const nextMacro = MACROS.filter((m) => m.a * 60 > nowS).sort((x, y) => x.a - y.a)[0];
  const macroNow = MACROS.find((m) => m.a * 60 <= nowS && nowS < m.b * 60);
  const hm5 = (m: number) => clock(m * 60, false);
  const explain =
    sel === "cpi" ? `CPI · High impact · restriction ${hm5(CPI.a)} to ${hm5(CPI.b)}` :
    sel === "kill" ? `${KILL.name} · ${hm5(KILL.a)} to ${hm5(KILL.b)}` :
    sel === "red" ? "Restricted · High impact news" :
    sel?.startsWith("win:") ? `${sel.slice(4)} · ${hm5(WINDOWS.find((w) => w.name === sel.slice(4))!.a)} to ${hm5(WINDOWS.find((w) => w.name === sel.slice(4))!.b)}` :
    sel?.startsWith("macro:") ? (() => { const m = MACROS.find((x) => x.a === +sel.slice(6))!; return `${m.name} · ${hm5(m.a)} to ${hm5(m.b)}`; })() :
    sel === "outside" ? "Outside your windows" :
    macroNow ? `${macroNow.name} · until ${hm5(macroNow.b)}` : nextMacro ? `Macro · starts in ${fmt(nextMacro.a * 60 - nowS)}` : "In window · Opening";
  const pieces: { a: number; b: number; k: "outside" | "window" | "red" | "orange"; s: string }[] = [];
  {
    const cuts = [0, ...WINDOWS.flatMap((w) => [w.a, w.b]), CPI.a, CPI.b, 1440].sort((x, y) => x - y);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1];
      if (b <= a) continue;
      const w = WINDOWS.find((x) => a >= x.a && b <= x.b);
      if (a >= CPI.a && b <= CPI.b) pieces.push({ a, b, k: "red", s: "red" });
      else if (w) pieces.push({ a, b, k: "window", s: `win:${w.name}` });
      else pieces.push({ a, b, k: "outside", s: "outside" });
    }
  }
  const ticks: { m: number; lab: boolean }[] = [];
  { const step = half === 30 ? 5 : half === 60 ? 10 : 15, labEvery = half === 30 ? 10 : 30;
    for (let m = Math.ceil((nowM - half) / step) * step; m <= nowM + half; m += step) ticks.push({ m, lab: m % labEvery === 0 }); }
  const selMacro = sel?.startsWith("macro:") ? MACROS.find((x) => x.a === +sel.slice(6)) : undefined;
  const selWin = sel?.startsWith("win:") ? WINDOWS.find((w) => w.name === sel.slice(4)) : undefined;
  const edges = selMacro ? { a: selMacro.a, b: selMacro.b, c: "o" } : sel === "cpi" ? { a: CPI.a, b: CPI.b, c: "r" } :
    sel === "kill" ? { a: KILL.a, b: KILL.b, c: "k" } : selWin ? { a: selWin.a, b: selWin.b, c: "g" } : null;
  // two edge labels that would touch are nudged apart (the bar is about 500 px wide at design size)
  const edgeXs = edges ? (() => {
    let xa = X(edges.a), xb = X(edges.b);
    const gap = ((xb - xa) / 100) * 500;
    if (gap < 46) { const c = (xa + xb) / 2, d = (46 / 500) * 50; xa = c - d; xb = c + d; }
    return [{ m: edges.a, x: xa }, { m: edges.b, x: xb }];
  })() : [];

  const evs = EVENTS[cur].filter((e) => e.impact === "H" || med);
  const pv = INSTRUMENTS[inst];
  const bal = Math.max(0, Number(balance.replace(/[^0-9.]/g, "")) || 0);
  const lots = stop > 0 ? Math.max(0, Math.floor((bal * risk / 100) / (stop * pv))) : 0;
  const riskUsd = lots * stop * pv;
  const next = lots + 1;

  const startHold = () => { if (hold !== "idle") return; setHold("holding"); touch(); holdT.current = setTimeout(() => { setDone({}); setChoice(null); setHold("done"); setTimeout(() => setHold("idle"), 350); }, HOLD_MS); };
  const endHold = () => { if (hold !== "holding") return; clearTimeout(holdT.current); setHold("idle"); };

  const cols = ORDER.map((t) => (t === tab ? "1fr" : t === "size" ? "0px" : "calc(var(--u) * 32)")).join(" ");
  const weeklyRestricted = state === "red" ? "red" : state === "orange" ? "orange" : "";

  const regionStrip = (t: Tab) => (
    <button type="button" className={`nt-strip ${t === "weekly" ? weeklyRestricted : ""}`} onClick={() => go(t)} aria-label={`Open ${STRIP[t]}`} disabled={!interactive || t === "size"} tabIndex={t === "size" ? -1 : undefined}><span>{STRIP[t]}</span></button>
  );

  return (
    <div className={`nt ${expanded ? "open" : ""} ${interactive ? "" : "still"}`} ref={root} data-ui data-state={state} onPointerDown={touch}>
      <div className="nt-head">
        {state === "greeting" ? (
          <>
            <div className="nt-l"><Letters text="Welcome" from="below" /></div>
            <div className="nt-gap" />
            <div className="nt-r"><Letters text={name} from="above" /></div>
          </>
        ) : (
          <>
            <button className="nt-l nt-hit" type="button" onClick={() => go("timeline")} disabled={!interactive} aria-label="Open Timeline">
              <img key={mascotName} className="nt-mascot" src={`/mascot/${mascotName}.svg`} alt="" width={30} height={30} style={state === "orange" && !celebrate ? { filter: "hue-rotate(28deg) saturate(1.3)" } : undefined} />
              <b className={`w-${state === "pink" ? "session" : state}`}>{word}</b>
              <span className="nt-cd">{fmt(shown)}</span>
            </button>
            <div className="nt-gap" />
            <div className="nt-r">
              <button className={`nt-icon ${tab === "size" && expanded ? "on" : ""}`} type="button" aria-label="Lot size calculator" disabled={!interactive} onClick={() => go(tab === "size" ? lastNonSize.current : "size")}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" /></svg>
              </button>
              <button key={pill.t.split(" ")[0] + pill.c} className={`nt-pill ${pill.c}`} type="button" disabled={!interactive} onClick={() => go("weekly")}>{pill.t}</button>
              <button className={`nt-count ${complete ? "ok" : ""}`} type="button" disabled={!interactive} onClick={() => go("checklist")} aria-label="Open Checklist">{complete ? "✓" : `${doneCount}/${CHECKLIST.length}`}</button>
            </div>
          </>
        )}
      </div>

      <div className="nt-body" aria-hidden={!expanded}>
        <div className="nt-clip">
          <div className="nt-inner" style={{ gridTemplateColumns: cols }}>
            {ORDER.map((t) => (
              <section key={t} className={`reg ${t === tab ? "act" : ""}`} data-tab={t}>
                {t !== tab ? regionStrip(t) : (
                  <div className="ap-main" key={tab}>
                    {tab === "timeline" && (
                      <>
                        <div className="nt-row">
                          <h4>Timing &amp; News</h4>
                          <span className="grow" />
                          <div className="nt-zoom">
                            <button type="button" aria-label="Show less time" onClick={() => { setZi(Math.max(0, zi - 1)); touch(); }} disabled={zi === 0}>−</button>
                            <span>±{half === 60 ? "1h" : half === 120 ? "2h" : "30m"}</span>
                            <button type="button" aria-label="Show more time" onClick={() => { setZi(Math.min(2, zi + 1)); touch(); }} disabled={zi === 2}>+</button>
                          </div>
                          <div className="nt-dd" data-menu>
                            <button className="nt-cap" type="button" onClick={() => { setMenu(menu === "ses" ? null : "ses"); touch(); }}>NY<Chevron /></button>
                            <Menu open={menu === "ses"} w={110}>
                              {["NY", "London", "Asia"].map((x) => <button key={x} type="button" className={x === "NY" ? "sel" : ""} onClick={() => { setMenu(null); if (x !== "NY") showTip(`${x} and your own profiles are in the app.`); }}><i>{x === "NY" ? "✓" : ""}</i>{x}</button>)}
                            </Menu>
                          </div>
                          <Pencil onTip={() => showTip()} />
                        </div>
                        <div className="tl" role="group" aria-label="Timeline around the current time">
                          <div className="tl-clock">{clock(nowS)}</div>
                          <div className="tl-marks">
                            {[{ k: "cpi", l: "CPI", t: CPI.t, m: false }].map((m) => X(m.t) > 4 && X(m.t) < 96 && (
                              <button key={m.k} type="button" className={`mk ${m.m ? "med" : "high"} ${sel === m.k ? "on" : ""}`} style={{ left: `${X(m.t)}%` }} onClick={() => { setSel(sel === m.k ? null : m.k); touch(); }}>{m.l}<svg width="9" height="8" viewBox="0 0 10 9"><path d="M0 0h10L5 9z" fill="currentColor" /></svg></button>
                            ))}
                          </div>
                          {X(KILL.b) > 0 && X(KILL.a) < 100 && <button type="button" className={`rail ${sel === "kill" ? "on" : ""}`} style={{ left: `${Math.max(0, X(KILL.a))}%`, width: `${Math.min(100, X(KILL.b)) - Math.max(0, X(KILL.a))}%` }} aria-label="Kill zone" onClick={() => { setSel(sel === "kill" ? null : "kill"); touch(); }} />}
                          {X(KILL.b) > 0 && X(KILL.a) < 100 && <button type="button" className={`rail-lab ${sel === "kill" ? "on" : ""}`} style={{ left: `${(Math.max(0, X(KILL.a)) + Math.min(100, X(KILL.b))) / 2}%` }} tabIndex={-1} aria-hidden="true" onClick={() => { setSel(sel === "kill" ? null : "kill"); touch(); }}>KZ</button>}
                          {X(KILL.b) > 0 && X(KILL.a) < 100 && <i className={`kz-edge ${sel === "kill" ? "on" : ""}`} style={{ left: `${Math.max(0, X(KILL.a))}%`, width: `${Math.min(100, X(KILL.b)) - Math.max(0, X(KILL.a))}%` }} aria-hidden="true" />}
                          <div className="tl-bar">
                            {pieces.map((p, i) => X(p.b) > 0 && X(p.a) < 100 && (
                              <button key={i} type="button" className={`pc ${p.k} ${sel === p.s ? "on" : ""}`} style={{ left: `${X(p.a)}%`, width: `calc(${X(p.b) - X(p.a)}% - 1px)` }} aria-label={p.k} onClick={() => { setSel(sel === p.s ? null : p.s); touch(); }} />
                            ))}
                            {MACROS.map((m) => X(m.b) > 0 && X(m.a) < 100 && (
                              <button key={m.a} type="button" className={`pc macro ${sel === `macro:${m.a}` ? "on" : ""}`} style={{ left: `${X(m.a)}%`, width: `calc(${X(m.b) - X(m.a)}% - 1px)` }} aria-label={m.name} onClick={() => { setSel(sel === `macro:${m.a}` ? null : `macro:${m.a}`); touch(); }} />
                            ))}
                            <i className="past" />
                          </div>
                          <i className="nowline" />
                          <div className="tl-ticks">
                            {ticks.map((t) => <i key={t.m} className={t.lab ? "lab" : ""} style={{ left: `${X(t.m)}%` }} />)}
                            {!edges && ticks.filter((t) => t.lab && X(t.m) > 9 && X(t.m) < 91).map((t) => <em key={t.m} style={{ left: `${X(t.m)}%` }}>{hm5(t.m)}</em>)}
                            {edgeXs.filter((e) => e.x > 0 && e.x < 100).map((e) => <em key={e.m} className={`edge ${edges!.c}`} style={{ left: `${e.x}%` }}>{hm5(e.m)}</em>)}
                          </div>
                        </div>
                        <p className="tl-explain" aria-live="polite">{explain}</p>
                      </>
                    )}

                    {tab === "weekly" && (
                      <>
                        <div className="nt-row">
                          <h4>Weekly <small>news &amp; bank holidays</small></h4>
                          <span className="grow" />
                          <div className="nt-dd" data-menu>
                            <button className="nt-cap" type="button" onClick={() => { setMenu(menu === "imp" ? null : "imp"); touch(); }}>{med ? "High + Med" : "High"}<Chevron /></button>
                            <Menu open={menu === "imp"} w={130}>
                              <label className="dis"><input type="checkbox" checked readOnly disabled /> High</label>
                              <label><input type="checkbox" checked={med} onChange={() => { setMed(!med); touch(); }} /> Medium</label>
                            </Menu>
                          </div>
                          <div className="nt-dd" data-menu>
                            <button className="nt-cap" type="button" onClick={() => { setMenu(menu === "cur" ? null : "cur"); touch(); }}>{cur}<Chevron /></button>
                            <Menu open={menu === "cur"} w={96}>
                              {CURRENCIES.map((c) => <button key={c} type="button" className={c === cur ? "sel" : ""} onClick={() => { setCur(c); setMenu(null); touch(); }}><i>{c === cur ? "✓" : ""}</i>{c}</button>)}
                            </Menu>
                          </div>
                          <Pencil onTip={() => showTip()} />
                        </div>
                        <div className="wk">
                          {DAYS.map((d, di) => {
                            const list = evs.filter((e) => e.day === di);
                            return (
                              <div key={d}>
                                <b className={`day ${di === 0 ? "today" : ""}`}>{d}{list.length === 0 && <em>nothing</em>}</b>
                                {list.map((e, i) => (
                                  <p className="ev" key={i}><time>{e.t}</time><i className={e.impact === "H" ? "h" : "m"} /><span className="nm">{e.name}</span><span className="cc">{e.code}</span>{e.f && <span className="fp">F {e.f} · P {e.p}</span>}</p>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {tab === "checklist" && (
                      <>
                        <div className="nt-row">
                          <h4>Checklist</h4>
                          <span className="grow" />
                          <div className="nt-dd" data-menu>
                            <button className="nt-cap" type="button" onClick={() => { setMenu(menu === "list" ? null : "list"); touch(); }}>Pre-trade<Chevron /></button>
                            <Menu open={menu === "list"} w={120}>
                              {["Pre-trade", "Post-trade"].map((s) => <button key={s} type="button" className={s === "Pre-trade" ? "sel" : ""} onClick={() => { setMenu(null); if (s !== "Pre-trade") showTip("Post-trade and your own lists are in the app."); }}><i>{s === "Pre-trade" ? "✓" : ""}</i>{s}</button>)}
                            </Menu>
                          </div>
                          <Pencil onTip={() => showTip()} />
                        </div>
                        <ul className="cl">
                          {CHECKLIST.map((c) => {
                            const on = c.options ? !!choice : !!done[c.id];
                            return (
                              <li key={c.id}>
                                <div className="cl-row">
                                  <button type="button" className={`cb ${on ? "on" : ""}`} aria-pressed={on} aria-label={c.label} onClick={() => (c.options ? setChooseOpen(!chooseOpen) : (setDone((d) => ({ ...d, [c.id]: !d[c.id] })), touch()))}>
                                    {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path className="draw" d="M5 12l5 5 9-10" /></svg>}
                                  </button>
                                  <span className={on ? "lbl dim" : "lbl"}>{c.label}</span>
                                  {c.options && (chooseOpen
                                    ? <span className="opts" data-menu>{c.options.map((o) => <button key={o} type="button" className={choice === o ? "sel" : ""} onClick={() => { setChoice(o); setChooseOpen(false); touch(); }}>{o}</button>)}</span>
                                    : <button type="button" className={`nt-cap choose ${choice ? "g" : ""}`} onClick={() => { setChooseOpen(true); touch(); }}>{choice ?? "Choose"}<Chevron /></button>)}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="nt-row cl-foot">
                          <small>{doneCount}/{CHECKLIST.length}</small>
                          <span className="grow" />
                          <button type="button" className={`hold ${hold}`} onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && startHold()} onKeyUp={endHold}><i />Hold to reset</button>
                        </div>
                      </>
                    )}

                    {tab === "size" && (
                      <>
                        <div className="nt-row">
                          <h4>Lot size</h4>
                          <div className="nt-dd" data-menu>
                            <button className="nt-cap" type="button" onClick={() => { setMenu(menu === "inst" ? null : "inst"); touch(); }}>{inst}<Chevron /></button>
                            <Menu open={menu === "inst"} w={96}>
                              {(Object.keys(INSTRUMENTS) as Inst[]).map((k) => <button key={k} type="button" className={k === inst ? "sel" : ""} onClick={() => { setInst(k); setMenu(null); touch(); }}><i>{k === inst ? "✓" : ""}</i>{k}</button>)}
                            </Menu>
                          </div>
                          <small className="muted">1 contract = ${pv}/pt</small>
                          <span className="grow" />
                          <Pencil onTip={() => showTip()} />
                        </div>
                        <div className="fields">
                          <label className="fld wide"><span>BALANCE</span><b><em>$</em><input inputMode="numeric" value={balance} onChange={(e) => { setBalance(e.target.value); touch(); }} aria-label="Balance" disabled={!interactive} /></b></label>
                          <div className="fld"><span>RISK %</span><b>{risk}<u><button type="button" aria-label="Less risk" onClick={() => { setRisk(Math.max(0.5, +(risk - 0.5).toFixed(2))); touch(); }}>−</button><button type="button" aria-label="More risk" onClick={() => { setRisk(Math.min(5, +(risk + 0.5).toFixed(2))); touch(); }}>+</button></u></b></div>
                          <div className="fld"><span>STOP pts</span><b>{stop}<u><button type="button" aria-label="Smaller stop" onClick={() => { setStop(Math.max(5, stop - 5)); touch(); }}>−</button><button type="button" aria-label="Bigger stop" onClick={() => { setStop(stop + 5); touch(); }}>+</button></u></b></div>
                        </div>
                        <div className="res">
                          <div><strong key={lots}>{lots}</strong><small>contracts</small></div>
                          <p><span className="g">Risk ${riskUsd.toLocaleString()} · {bal ? ((riskUsd / bal) * 100).toFixed(2).replace(/\.?0+$/, "") : 0}%</span><br />of ${bal.toLocaleString()}<br /><em>Up one step: {next} → ${(next * stop * pv).toLocaleString()}</em></p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
      {tip && <div className="nt-tip" role="status" key={tipMsg + tip}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>{tipMsg}</div>}
      {celebrate > 0 && <div className="nt-confetti" key={celebrate} aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ ["--a" as string]: `${(i / 26) * 360}deg`, ["--r" as string]: `${90 + ((i * 37) % 70)}px`, ["--h" as string]: ["#40EB73", "#64D2FF", "#FF73BF", "#FFD60A", "#B36BFF"][i % 5] }} />)}</div>}
    </div>
  );
}
