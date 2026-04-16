import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { guestRegex } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Let Supabase auth API, our guest route, and the OAuth callback through
  // without a session check to avoid infinite redirect loops.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // Refresh the Supabase session cookie and get the current user.
  const { supabaseResponse, user } = await updateSession(request);

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!user) {
    // Only redirect to the guest route for page navigations (not API calls,
    // assets, etc.) to avoid infinite loops if anonymous auth is disabled.
    const isPageRequest =
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next/") &&
      !pathname.includes(".");

    if (isPageRequest) {
      const redirectUrl = encodeURIComponent(new URL(request.url).pathname);
      return NextResponse.redirect(
        new URL(
          `${base}/api/auth/guest?redirectUrl=${redirectUrl}`,
          request.url
        )
      );
    }

    // For API routes and assets, just let the request through unauthenticated.
    return supabaseResponse;
  }

  const isGuest = guestRegex.test(user.email ?? "");

  // Logged-in non-guest users should not be able to visit /login or /register.
  if (!isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  // Return the response that carries the refreshed session cookies.
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
