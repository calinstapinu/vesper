import crypto from "node:crypto";
import { q } from "./db";

export const TRIAL_DAYS = 7;
/** A token is valid for at most this long, so a revocation reaches every device within three days even if it is offline. */
export const TOKEN_HOURS = 72;

export type Status = "trial" | "license" | "expired" | "revoked";
export type Device = {
  id: number; device_hash: string; user_id: number; trial_ends_at: Date | string; status: string;
  license_key: string | null; license_ends_at: Date | string | null;
};

/** The PEM as pasted into an env var can come with real newlines, literal \n, or spaces instead of line breaks: rebuild it from the base64 body. */
const privateKey = () => {
  const raw = process.env.LICENSE_PRIVATE_KEY;
  if (!raw) throw new Error("LICENSE_PRIVATE_KEY is not set");
  const body = raw.replace(/\\n/g, "\n").replace(/-----[A-Z ]+-----/g, "").replace(/[^A-Za-z0-9+/=]/g, "");
  const pem = `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
  return crypto.createPrivateKey(pem);
};

/** `base64url(payload JSON) "." base64url(Ed25519 signature)`: the app verifies the exact payload bytes. */
export function signToken(claims: { email: string; dev: string; kind: "trial" | "license"; exp: number; ends: number | null }) {
  const payload = Buffer.from(JSON.stringify({ v: 1, iat: Math.floor(Date.now() / 1000), ...claims }));
  return payload.toString("base64url") + "." + crypto.sign(null, payload, privateKey()).toString("base64url");
}

const toMs = (d: Date | string | null) => (d == null ? null : new Date(d).getTime());

export async function entitlement(d: Device, now = Date.now()): Promise<{ status: Status; endsMs: number | null }> {
  if (d.status === "revoked") return { status: "revoked", endsMs: null };
  if (d.license_key) {
    const [k] = await q<{ revoked: boolean }>("SELECT revoked FROM license_keys WHERE code = $1", [d.license_key]);
    const end = toMs(d.license_ends_at);
    if (k && !k.revoked && (end == null || end > now)) return { status: "license", endsMs: end };
  }
  const trialEnd = toMs(d.trial_ends_at)!;
  if (trialEnd > now) return { status: "trial", endsMs: trialEnd };
  return { status: "expired", endsMs: trialEnd };
}

export function makeKey() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from(crypto.randomBytes(4), (b) => abc[b % abc.length]).join("");
  return `VSPR-${part()}-${part()}-${part()}`;
}

export const normalizeEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
export const validEmail = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const validDevice = (d: unknown): d is string => typeof d === "string" && /^[0-9a-f]{64}$/.test(d);

/** At most `limit` requests per `windowMin` minutes for one caller and route. */
export async function limited(req: Request, route: string, limit = 30, windowMin = 10) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const bucket = `${route}:${crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
  const [{ n }] = await q<{ n: number }>("SELECT count(*)::int AS n FROM hits WHERE bucket = $1 AND at > now() - ($2 || ' minutes')::interval", [bucket, String(windowMin)]);
  if (n >= limit) return true;
  await q("INSERT INTO hits (bucket) VALUES ($1)", [bucket]);
  if (Math.random() < 0.02) await q("DELETE FROM hits WHERE at < now() - interval '1 day'");
  return false;
}
