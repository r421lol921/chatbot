import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const supabase = await createClient();

  // If there is already a valid session, just return success.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (user) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  // Try anonymous sign-in first (requires enabling in Supabase dashboard).
  const { error: anonError } = await supabase.auth.signInAnonymously();

  if (!anonError) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  // Fallback: create a guest user with a generated email and password.
  const guestId = randomUUID();
  const guestEmail = `guest-${guestId}@guest.lio.chat`;
  const guestPassword = randomUUID();

  const { error: signUpError } = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
    options: {
      data: { is_guest: true },
    },
  });

  if (signUpError) {
    console.error("[v0] Guest signup failed:", signUpError.message);
    return NextResponse.redirect(new URL(`${base}/login`, request.url));
  }

  return NextResponse.redirect(new URL(`${base}/`, request.url));
}
