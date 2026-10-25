import { guard } from "@/lib/guard";
import { q } from "@/lib/db";
import { type Device, TOKEN_HOURS, TRIAL_DAYS, entitlement, limited, normalizeEmail, signToken, validDevice, validEmail } from "@/lib/license";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// The app calls this at launch and every few hours: it registers the Mac on first contact (starting the one-time trial),
// applies an activation key when one is sent, and answers with the current status and a short-lived signed token.
async function handle(req: Request) {
  if (await limited(req, "session", 60, 10)) return json({ error: "slow_down" }, 429);
  const b = await req.json().catch(() => null);
  const email = normalizeEmail(b?.email);
  if (!validEmail(email) || !validDevice(b?.device)) return json({ error: "bad_request" }, 400);
  const app = String(b.app ?? "").slice(0, 32), os = String(b.os ?? "").slice(0, 48);

  const [user] = await q<{ id: number; email: string }>(
    "INSERT INTO users (email, source) VALUES ($1, 'app') ON CONFLICT (email) DO UPDATE SET email = users.email RETURNING id, email", [email]);

  let [dev] = await q<Device>("SELECT * FROM devices WHERE device_hash = $1", [b.device]);
  if (!dev) {
    // one trial per person and per Mac: a second Mac on the same email, or a new email on a known Mac, gets no new trial
    const [{ n }] = await q<{ n: number }>("SELECT count(*)::int AS n FROM devices WHERE user_id = $1", [user.id]);
    const days = n > 0 ? 0 : TRIAL_DAYS;
    [dev] = await q<Device>(
      "INSERT INTO devices (device_hash, user_id, trial_ends_at, app_version, os) VALUES ($1, $2, now() + ($3 || ' days')::interval, $4, $5) RETURNING *",
      [b.device, user.id, String(days), app, os]);
  }

  let keyError: string | null = null;
  const code = typeof b.key === "string" ? b.key.trim().toUpperCase() : "";
  if (code) {
    const [k] = await q<{ code: string; days: number | null; used_by: number | null; revoked: boolean }>("SELECT * FROM license_keys WHERE code = $1", [code]);
    if (!k || k.revoked) keyError = "invalid_key";
    else if (k.used_by && k.used_by !== dev.id) keyError = "key_in_use";
    else {
      if (dev.license_key !== code) {
        await q("UPDATE license_keys SET used_by = $1, used_at = COALESCE(used_at, now()) WHERE code = $2", [dev.id, code]);
        [dev] = await q<Device>(
          "UPDATE devices SET license_key = $1, license_ends_at = CASE WHEN $2::int IS NULL THEN NULL ELSE now() + ($2::int || ' days')::interval END WHERE id = $3 RETURNING *",
          [code, k.days, dev.id]);
      }
      // a valid key issued by the admin is a new authorization: it lifts an earlier revoke of this Mac
      if (dev.status === "revoked") [dev] = await q<Device>("UPDATE devices SET status = 'active' WHERE id = $1 RETURNING *", [dev.id]);
    }
  }

  await q("UPDATE devices SET last_seen = now(), checks = checks + 1, app_version = $1, os = $2 WHERE id = $3", [app, os, dev.id]);
  const ent = await entitlement(dev);
  const [owner] = await q<{ email: string }>("SELECT email FROM users WHERE id = $1", [dev.user_id]);
  if (ent.status === "trial" || ent.status === "license") {
    const exp = Math.floor(Math.min(ent.endsMs ?? Infinity, Date.now() + TOKEN_HOURS * 3600_000) / 1000);
    const token = signToken({ email: owner.email, dev: b.device, kind: ent.status, exp, ends: ent.endsMs ? Math.floor(ent.endsMs / 1000) : null });
    return json({ status: ent.status, token, ends: ent.endsMs, keyError });
  }
  return json({ status: ent.status, ends: ent.endsMs, keyError });
}

export const POST = guard(handle);
