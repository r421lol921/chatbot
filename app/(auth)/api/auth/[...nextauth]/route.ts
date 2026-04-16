/**
 * Supabase Auth callback route handler.
 *
 * Replaces the old NextAuth [...nextauth] catch-all route.
 * Handles the OAuth / magic-link code-exchange callback that Supabase
 * redirects back to after a provider login.
 *
 * URL pattern:  /api/auth/callback?code=<code>&next=<path>
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to an error page or home.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
