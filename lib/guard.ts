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
      return Response.json({ error: code }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  };
}
