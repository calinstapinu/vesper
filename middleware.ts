import { NextResponse, type NextRequest } from "next/server";

// Basic Auth in front of the admin page. No ADMIN_PASSWORD means the page is closed, never open.
export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return new NextResponse("Admin is not configured", { status: 503 });
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const given = atob(header.slice(6)).split(":").slice(1).join(":");
    let diff = given.length ^ pass.length;
    for (let i = 0; i < Math.max(given.length, pass.length); i++) diff |= (given.charCodeAt(i) || 0) ^ (pass.charCodeAt(i) || 0);
    if (diff === 0) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Vesper admin"' } });
}

export const config = { matcher: ["/admin/:path*"] };
