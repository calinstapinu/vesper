import { neon } from "@neondatabase/serverless";

// One tiny query function over Postgres. Production and previews use DATABASE_URL (Neon, over HTTP). Without it, local
// development falls back to PGlite, a real Postgres running in-process, so the same SQL runs everywhere.

type Row = Record<string, unknown>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'site',
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  notice_version TEXT NOT NULL DEFAULT '1'
);
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  device_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  app_version TEXT,
  os TEXT,
  checks INTEGER NOT NULL DEFAULT 0,
  trial_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  license_key TEXT,
  license_ends_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS license_keys (
  code TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  days INTEGER,
  note TEXT,
  used_by INTEGER REFERENCES devices(id),
  used_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hits (bucket TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS hits_bucket_at ON hits (bucket, at);
`;

let runner: Promise<Runner> | null = null;

async function make(): Promise<Runner> {
  let run: Runner;
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    run = async (text, params = []) => (await sql.query(text, params)) as Row[];
  } else {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is not set");
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    mkdirSync("./.data", { recursive: true });
    const db = new PGlite(process.env.LICENSE_DEV_DB ?? "./.data/dev-db");
    run = async (text, params = []) => (await db.query<Row>(text, params)).rows;
    await db.exec(SCHEMA);
    return run;
  }
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await run(stmt);
  return run;
}

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  runner ??= make();
  return (await (await runner)(text, params)) as T[];
}
