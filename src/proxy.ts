import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Single gate for every authenticated area of the app.
 *
 * Before this existed, each layout did its own check and anything that forgot
 * to check was simply open. This now rejects unsigned, forged or expired
 * session cookies before a page or server action ever runs.
 *
 * It deliberately does NOT touch the database — role checks and the
 * force-password-change guard stay in the layouts, where Prisma is available
 * and the values are read fresh on every request.
 *
 * Named `proxy` (not `middleware`): Next.js 16 renamed this file convention.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);

  if (userId) return NextResponse.next();

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("error", "Please sign in to continue");

  const response = NextResponse.redirect(loginUrl);
  // Drop the bad cookie (expired, forged, or issued before signing existed)
  // so the browser stops sending it on every subsequent request.
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete("userId");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supervisor/:path*",
    "/staff/:path*",
    "/auth/force-password-change",
  ],
};
