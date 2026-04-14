import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";

export async function GET(request: Request) {
  console.log("[v0] guest route hit");
  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirectUrl") || "/";
  const redirectUrl =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? "lio-dev-fallback-secret-change-in-production",
      secureCookie: !isDevelopmentEnvironment,
    });
    console.log("[v0] guest route token:", token ? "exists" : "null");

    if (token) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      return NextResponse.redirect(new URL(`${base}/`, request.url));
    }

    console.log("[v0] guest route: calling signIn guest");
    return signIn("guest", { redirect: true, redirectTo: redirectUrl });
  } catch (error) {
    console.error("[v0] guest route error:", error);
    throw error;
  }
}
