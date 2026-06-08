import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // If there is already a valid session, just redirect home.
  const existing = await auth.api.getSession({
    headers: request.headers,
  });

  if (existing?.user) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  // Create a guest user with a generated email and password.
  const guestId = randomUUID();
  const guestEmail = `guest-${guestId}@guest.lio.chat`;
  const guestPassword = randomUUID();

  try {
    await auth.api.signUpEmail({
      body: {
        email: guestEmail,
        password: guestPassword,
        name: `Guest`,
      },
      headers: request.headers,
    });
  } catch (err) {
    console.error("[guest] Guest signup failed:", err);
  }

  return NextResponse.redirect(new URL(`${base}/`, request.url));
}
