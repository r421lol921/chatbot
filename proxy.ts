import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { guestRegex } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Let Supabase auth API, our guest route, the OAuth callback, login and
  // register through without a session check to avoid infinite redirect loops.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Refresh the Supabase session cookie and get the current user.
  const { supabaseResponse, user } = await updateSession(request);

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!user) {
    // Only redirect page navigations — API routes are let through unauthenticated.
    if (!pathname.startsWith("/api/")) {
      const redirectUrl = encodeURIComponent(new URL(request.url).pathname);
      return NextResponse.redirect(
        new URL(
          `${base}/api/auth/guest?redirectUrl=${redirectUrl}`,
          request.url
        )
      );
    }

    // For API routes, just let the request through unauthenticated.
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
