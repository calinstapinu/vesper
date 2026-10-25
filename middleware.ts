import { NextResponse, type NextRequest } from "next/server";
import { basicOk } from "@/lib/adminAuth";

// Basic Auth in front of the admin page. No ADMIN_PASSWORD means the page is closed, never open.
export function middleware(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return new NextResponse("Admin is not configured", { status: 503 });
  if (basicOk(req.headers.get("authorization"), pass)) return NextResponse.next();
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Vesper admin"' } });
}

export const config = { matcher: ["/admin/:path*"] };
