import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirectUrl") || "/";
  const redirectUrl =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  const supabase = await createClient();

  // If there is already a valid session, just redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (user) {
    return NextResponse.redirect(new URL(`${base}${redirectUrl}`, request.url));
  }

  // Create an anonymous (guest) Supabase session.
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    // Fall back to the home page — redirecting to /login would cause a loop
    // because the middleware would send the user back here again.
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  return NextResponse.redirect(new URL(`${base}${redirectUrl}`, request.url));
}
