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
    // Anonymous sign-in failed (e.g. disabled in Supabase dashboard).
    // Redirect to /login so the user can sign in with email/password.
    // We pass the original destination as a query param so the login page
    // can redirect back after a successful sign-in.
    const loginUrl = new URL(`${base}/login`, request.url);
    if (redirectUrl !== "/") {
      loginUrl.searchParams.set("next", redirectUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(`${base}${redirectUrl}`, request.url));
}
