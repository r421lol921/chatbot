import { NextResponse } from "next/server";

// This route was previously used by Supabase's email-confirmation flow.
// Better Auth handles auth entirely via /api/auth/[...all].
// Redirect to home to avoid broken links from old emails.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return NextResponse.redirect(`${origin}${base}/`);
}
