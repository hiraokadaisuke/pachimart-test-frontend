import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/trade-navi")) {
    // ⚠️ Legacy route redirect: /trade-navi moved under /market/navi.
    // Routing change warning intentionally kept per request.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace(/^\/trade-navi/, "/market/navi");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/trade-navi", "/trade-navi/:path*"],
};
