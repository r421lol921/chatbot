import type { NextAuthConfig } from "next-auth";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: `${base}/login`,
    newUser: `${base}/`,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnAuthApi = nextUrl.pathname.startsWith("/api/auth");
      const isOnGuestApi = nextUrl.pathname.startsWith("/api/auth/guest");

      // Always allow auth-related paths
      if (isOnAuthApi || isOnGuestApi) return true;

      // Redirect logged-in users away from login/register
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL(`${base}/`, nextUrl));
      }

      // Redirect unauthenticated users to login
      if (!isLoggedIn && !isOnLogin && !isOnRegister) {
        return Response.redirect(new URL(`${base}/login`, nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
