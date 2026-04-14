import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDevelopmentEnvironment } from "@/lib/constants";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth routes, API routes, static files through
  if (
    pathname.startsWith(`${base}/api/auth`) ||
    pathname.startsWith(`${base}/login`) ||
    pathname.startsWith(`${base}/register`) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const guestUrl = new URL(
      `${base}/api/auth/guest`,
      request.url
    );
    guestUrl.searchParams.set("redirectUrl", pathname);
    return NextResponse.redirect(guestUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
