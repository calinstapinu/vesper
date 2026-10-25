import { q } from "@/lib/db";
import { limited, normalizeEmail, validEmail } from "@/lib/license";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The email step before the download: stores the address as the identifier of this beta user.
export async function POST(req: Request) {
  if (await limited(req, "signup", 20, 10)) return Response.json({ error: "slow_down" }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (b?.website) return Response.json({ ok: true }); // honeypot: bots fill it, people never see it
  const email = normalizeEmail(b?.email);
  if (!validEmail(email)) return Response.json({ error: "bad_email" }, { status: 400 });
  await q(
    "INSERT INTO users (email, source, marketing_opt_in) VALUES ($1, 'site', $2) ON CONFLICT (email) DO UPDATE SET marketing_opt_in = users.marketing_opt_in OR $2",
    [email, b?.marketing === true]);
  return Response.json({ ok: true });
}
