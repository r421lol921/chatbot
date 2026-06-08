import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { guestRegex } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Let Better Auth API routes, login, and register through without a session check.
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!session?.user) {
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

    return NextResponse.next();
  }

  const isGuest = guestRegex.test(session.user.email ?? "");

  // Logged-in non-guest users should not visit /login or /register.
  if (!isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  return NextResponse.next();
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
