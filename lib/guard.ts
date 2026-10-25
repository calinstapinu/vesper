/** Wraps a route so an unexpected failure answers with a short, secret-free code instead of an empty 500; the details go to the logs. */
export function guard(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("route failed:", msg);
      const code = /DATABASE_URL/.test(msg) ? "db_not_configured" : /LICENSE_PRIVATE_KEY|PEM|DECODER|asn1|private key/i.test(msg) ? "key_problem"
        : /relation|syntax|column|permission|password|connect|fetch|ECONN|ENOTFOUND|neon/i.test(msg) ? "db_error" : "server_error";
      // for a key problem, only the length of what the server received (the right key is 119 characters), never its content
      const extra = code === "key_problem" ? { keyLength: (process.env.LICENSE_PRIVATE_KEY ?? process.env.LICENCE_PRIVATE_KEY ?? "").length } : {};
      return Response.json({ error: code, ...extra }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  };
}
