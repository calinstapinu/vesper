import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (an in-process Postgres used only when DATABASE_URL is missing, i.e. local development) ships a wasm file
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
