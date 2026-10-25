"use client";
import { useState } from "react";

export default function FeedbackForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.get("email"), message: f.get("message"), website: f.get("website") }) });
      setState(r.ok ? "sent" : "error");
    } catch { setState("error"); }
  };
  if (state === "sent") return <p className="fb-ok">Thank you. We read every message.</p>;
  return (
    <form className="fb" onSubmit={send}>
      <label>Your email<input type="email" name="email" defaultValue={defaultEmail} autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>
      <label>What worked, what did not, what is missing?<textarea name="message" required minLength={3} maxLength={4000} rows={7} /></label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="gate-hp" aria-hidden="true" />
      {state === "error" && <p className="gate-err" role="alert">Could not send. Please try again in a moment.</p>}
      <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send feedback"}</button>
    </form>
  );
}
