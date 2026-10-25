"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import OpenTutorial from "./OpenTutorial";

const DMG = "/download/Vesper.dmg";

// "Free beta for Mac": asks for an email first. It is the identifier of this beta user, nothing more.
export default function DownloadLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"form" | "sending" | "done" | "phone">("form");
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const show = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setPhase(matchMedia("(pointer: coarse)").matches && innerWidth < 900 ? "phone" : "form");
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { clearTimeout(t); removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [open]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPhase("sending"); setError("");
    try {
      const r = await fetch("/api/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, marketing, website: form.get("website") }) });
      if (!r.ok) throw new Error(r.status === 429 ? "Too many tries. Please wait a few minutes." : "Please check the email address.");
      setPhase("done");
      const a = document.createElement("a");
      a.href = DMG; a.download = "Vesper.dmg";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      setPhase("form"); setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <>
      <a className={className} href={DMG} onClick={show} data-magnet>{children}</a>
      {open && createPortal(
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-t" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className={`gate-box${phase === "done" ? " wide" : ""}`}>
            <button className="gate-x" type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            {phase === "phone" ? (
              <>
                <h2 id="gate-t">Vesper is for Mac</h2>
                <p>Open this page on your MacBook to download the beta.</p>
              </>
            ) : phase === "done" ? (
              <>
                <h2 id="gate-t">Your download has started</h2>
                <p>Open the DMG and drag Vesper to Applications. macOS will warn you the first time; this takes about 30 seconds, once.</p>
                <OpenTutorial />
                <p className="gate-note">Vesper will ask for this same email once, to start your 7-day beta.</p>
                <button className="gate-go" type="button" onClick={() => setOpen(false)}>Done</button>
              </>
            ) : (
              <form onSubmit={submit}>
                <h2 id="gate-t">Download the Vesper beta</h2>
                <p>Enter your email to download. It is used strictly as your identifier, so we can help you if something goes wrong with your copy. There is no marketing during the beta.</p>
                <input ref={input} type="email" name="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="gate-hp" aria-hidden="true" />
                <label className="gate-opt"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> Optional: email me once when Vesper launches.</label>
                {error && <p className="gate-err" role="alert">{error}</p>}
                <button className="gate-go" type="submit" disabled={phase === "sending"}>{phase === "sending" ? "One moment…" : "Download for Mac"}</button>
                <p className="gate-note">The beta runs for 7 days. After that you need an activation key from us.</p>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
