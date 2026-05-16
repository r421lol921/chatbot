import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { guestRegex } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Let auth API routes, the callback route, login, and register through without a session check.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return NextResponse.next();
  }

  // Refresh the Supabase session cookie and get the current user.
  const { supabaseResponse, user } = await updateSession(request);

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!user) {
    // No session — redirect to login page.
    return NextResponse.redirect(new URL(`${base}/login`, request.url));
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
