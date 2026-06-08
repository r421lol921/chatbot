/**
 * Better Auth shim.
 *
 * Exports the same surface as the old NextAuth / Supabase module so every
 * caller (route handlers, server actions, layouts) works without changes:
 *
 *   import { auth } from "@/app/(auth)/auth";
 *   const session = await auth();
 *   session?.user.id   // string
 *   session?.user.type // "guest" | "regular" | "plus"
 */

import { auth as betterAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { guestRegex } from "@/lib/constants";

export type UserType = "guest" | "regular" | "plus";

export interface AuthSession {
  user: {
    id: string;
    email: string | null;
    type: UserType;
  };
}

/**
 * Returns the current session (or null if unauthenticated).
 */
export async function auth(): Promise<AuthSession | null> {
  const session = await betterAuth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const email = session.user.email ?? "";
  const isGuest = guestRegex.test(email);
  const userType: UserType = isGuest ? "guest" : "regular";

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      type: userType,
    },
  };
}

export async function signOut(_opts?: { redirectTo?: string }) {
  // No-op shim — client-side sign-out uses authClient.signOut() from lib/auth-client.ts
}

export async function signIn(
  _provider: string,
  _credentials?: Record<string, unknown>
) {
  // No-op shim — real sign-in is handled by Better Auth in actions.ts
}
