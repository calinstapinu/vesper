import { revalidatePath } from "next/cache";
import { q } from "@/lib/db";
import { makeKey } from "@/lib/license";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vesper admin", robots: { index: false, follow: false } };

async function genKey(f: FormData) {
  "use server";
  const days = parseInt(String(f.get("days") ?? ""), 10);
  await q("INSERT INTO license_keys (code, days, note) VALUES ($1, $2, $3)", [makeKey(), Number.isFinite(days) && days > 0 ? days : null, String(f.get("note") ?? "").slice(0, 200)]);
  revalidatePath("/admin");
}
async function extend(f: FormData) {
  "use server";
  const days = Math.max(1, Math.min(365, parseInt(String(f.get("days") ?? "7"), 10) || 7));
  await q("UPDATE devices SET trial_ends_at = GREATEST(now(), trial_ends_at) + ($1 || ' days')::interval WHERE id = $2", [String(days), Number(f.get("id"))]);
  revalidatePath("/admin");
}
async function setStatus(f: FormData) {
  "use server";
  const status = f.get("status") === "revoked" ? "revoked" : "active";
  await q("UPDATE devices SET status = $1 WHERE id = $2", [status, Number(f.get("id"))]);
  revalidatePath("/admin");
}
async function revokeKey(f: FormData) {
  "use server";
  await q("UPDATE license_keys SET revoked = NOT revoked WHERE code = $1", [String(f.get("code"))]);
  revalidatePath("/admin");
}

type Dev = { id: number; device_hash: string; email: string; first_seen: string; last_seen: string; app_version: string | null; os: string | null; checks: number; trial_ends_at: string; status: string; license_key: string | null; license_ends_at: string | null; revoked: boolean | null };
const fmt = (d: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 16).replace("T", " ") : "-");

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const term = ((await searchParams).q ?? "").trim().toLowerCase();
  const like = `%${term}%`;
  const users = await q<{ id: number; email: string; created_at: string; source: string; marketing_opt_in: boolean }>("SELECT * FROM users WHERE email LIKE $1 ORDER BY created_at DESC LIMIT 200", [like]);
  const devs = await q<Dev>(
    "SELECT d.*, u.email, k.revoked FROM devices d JOIN users u ON u.id = d.user_id LEFT JOIN license_keys k ON k.code = d.license_key WHERE u.email LIKE $1 ORDER BY d.last_seen DESC LIMIT 300", [like]);
  const keys = await q<{ code: string; created_at: string; days: number | null; note: string | null; used_by: number | null; revoked: boolean }>("SELECT * FROM license_keys ORDER BY created_at DESC LIMIT 100");
  const feedback = await q<{ id: number; email: string | null; message: string; created_at: string }>("SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50");
  const now = Date.now();
  const state = (d: Dev) => d.status === "revoked" ? "revoked" : d.license_key && !d.revoked && (!d.license_ends_at || new Date(d.license_ends_at).getTime() > now) ? "license" : new Date(d.trial_ends_at).getTime() > now ? "trial" : "expired";

  return (
    <main style={{ font: "14px/1.45 ui-sans-serif, system-ui", background: "#0b0b0f", color: "#e8e8ee", minHeight: "100vh", padding: 24 }}>
      <style>{`.a table{border-collapse:collapse;width:100%;margin:8px 0 28px}.a th,.a td{border-bottom:1px solid #22232b;padding:6px 8px;text-align:left;vertical-align:top}.a th{color:#9a9aa8;font-weight:500}.a input,.a button{font:inherit;background:#15161c;color:#e8e8ee;border:1px solid #2c2d37;border-radius:6px;padding:4px 8px}.a button{cursor:pointer}.a h2{margin:26px 0 4px;font-size:16px}.a .bad{color:#ff6b6b}.a .ok{color:#5be08a}.a .mut{color:#9a9aa8}.a form{display:inline-flex;gap:4px;margin-right:6px}`}</style>
      <div className="a">
        <h1 style={{ margin: 0 }}>Vesper admin</h1>
        <form method="get" style={{ margin: "12px 0" }}><input name="q" defaultValue={term} placeholder="search email" size={34} /> <button>Search</button></form>
        <p className="mut">{users.length} users · {devs.length} devices (newest activity first)</p>

        <h2>Devices</h2>
        <table><thead><tr><th>Email</th><th>State</th><th>Trial ends</th><th>License</th><th>Last seen</th><th>App · macOS · checks</th><th>Actions</th></tr></thead><tbody>
          {devs.map((d) => {
            const s = state(d);
            return (
              <tr key={d.id}>
                <td>{d.email}<div className="mut">{d.device_hash.slice(0, 10)}</div></td>
                <td className={s === "trial" || s === "license" ? "ok" : "bad"}>{s}</td>
                <td>{fmt(d.trial_ends_at)}</td>
                <td>{d.license_key ?? "-"}<div className="mut">{d.license_key ? `to ${fmt(d.license_ends_at)}` : ""}</div></td>
                <td>{fmt(d.last_seen)}</td>
                <td>{d.app_version ?? "-"} · {d.os ?? "-"} · {d.checks}</td>
                <td>
                  <form action={extend}><input type="hidden" name="id" value={d.id} /><input name="days" defaultValue="7" size={2} /><button>+ days trial</button></form>
                  <form action={setStatus}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="status" value={d.status === "revoked" ? "active" : "revoked"} /><button>{d.status === "revoked" ? "Restore" : "Revoke"}</button></form>
                </td>
              </tr>
            );
          })}
        </tbody></table>

        <h2>Activation keys</h2>
        <form action={genKey}><input name="days" placeholder="days (empty = no end)" size={20} /><input name="note" placeholder="note (who it is for)" size={28} /><button>Generate key</button></form>
        <table><thead><tr><th>Key</th><th>Length</th><th>Note</th><th>Used</th><th>Created</th><th /></tr></thead><tbody>
          {keys.map((k) => (
            <tr key={k.code}><td style={{ fontFamily: "ui-monospace, monospace" }}>{k.code}</td><td>{k.days ? `${k.days} d` : "no end"}</td><td>{k.note}</td><td>{k.used_by ? "yes" : "no"}</td><td>{fmt(k.created_at)}</td>
              <td><form action={revokeKey}><input type="hidden" name="code" value={k.code} /><button>{k.revoked ? "Un-revoke" : "Revoke"}</button></form></td></tr>
          ))}
        </tbody></table>

        <h2>Feedback</h2>
        <table><tbody>{feedback.map((f) => <tr key={f.id}><td className="mut" style={{ whiteSpace: "nowrap" }}>{fmt(f.created_at)}</td><td>{f.email ?? "-"}</td><td style={{ whiteSpace: "pre-wrap" }}>{f.message}</td></tr>)}</tbody></table>

        <h2>Users</h2>
        <table><thead><tr><th>Email</th><th>Joined</th><th>Source</th><th>Wants launch email</th></tr></thead><tbody>
          {users.map((u) => <tr key={u.id}><td>{u.email}</td><td>{fmt(u.created_at)}</td><td>{u.source}</td><td>{u.marketing_opt_in ? "yes" : "no"}</td></tr>)}
        </tbody></table>
      </div>
    </main>
  );
}
