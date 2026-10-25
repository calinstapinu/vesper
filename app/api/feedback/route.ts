import { guard } from "@/lib/guard";
import { q } from "@/lib/db";
import { limited, normalizeEmail, validEmail } from "@/lib/license";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  if (await limited(req, "feedback", 10, 10)) return Response.json({ error: "slow_down" }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (b?.website) return Response.json({ ok: true });
  const message = String(b?.message ?? "").trim().slice(0, 4000);
  const email = normalizeEmail(b?.email);
  if (message.length < 3) return Response.json({ error: "empty" }, { status: 400 });
  await q("INSERT INTO feedback (email, message) VALUES ($1, $2)", [validEmail(email) ? email : null, message]);
  return Response.json({ ok: true });
}

export const POST = guard(handle);
