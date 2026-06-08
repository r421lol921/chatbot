/**
 * Supabase-backed auth shim.
 *
 * Exports the same surface as the old NextAuth module so every caller
 * (route handlers, server actions, layouts) works without changes:
 *
 *   import { auth, signIn, signOut } from "@/app/(auth)/auth";
 *   const session = await auth();
 *   session?.user.id   // UUID string
 *   session?.user.type // "guest" | "regular" | "plus"
 */

import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/db/queries";
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
 * Drop-in replacement for NextAuth's `auth()`.
 */
export async function auth(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Determine user type: guest emails match the guestRegex pattern.
  const isGuest = guestRegex.test(user.email ?? "") || user.is_anonymous === true;

  let userType: UserType = isGuest ? "guest" : "regular";

  // For real (non-guest) users, read the latest userType from our DB so Plus
  // upgrades take effect without requiring a new sign-in.
  if (!isGuest) {
    try {
      const dbUser = await getUserById({ id: user.id });
      if (dbUser?.userType) {
        userType = dbUser.userType as UserType;
      }
    } catch {
      // Silently fall back to "regular"
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      type: userType,
    },
  };
}

/**
 * Signs the current user out via Supabase.
 * Pass `{ redirectTo }` to navigate after sign-out (handled client-side).
 */
export async function signOut(_opts?: { redirectTo?: string }) {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Thin wrapper kept for import-compatibility with old NextAuth callers.
 * Actual sign-in logic lives in `app/(auth)/actions.ts`.
 */
export async function signIn(
  _provider: string,
  _credentials?: Record<string, unknown>
) {
  // No-op shim — real sign-in is handled by Supabase in actions.ts
}
