import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const v0RuntimeUrl = process.env.V0_RUNTIME_URL;
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
const explicitBase = process.env.BETTER_AUTH_URL;

const baseURL =
  explicitBase ?? productionUrl ?? vercelUrl ?? v0RuntimeUrl ?? "http://localhost:3000";

const trustedOrigins = [
  baseURL,
  v0RuntimeUrl,
  vercelUrl,
  productionUrl,
].filter(Boolean) as string[];

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  advanced:
    process.env.NODE_ENV === "development"
      ? {
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
          },
        }
      : undefined,
});

export type Session = typeof auth.$Infer.Session;
