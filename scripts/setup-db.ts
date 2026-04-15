import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env.development.local" });

const runSetup = async () => {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;

  if (!url) {
    console.error("No database URL found. Please set POSTGRES_URL_NON_POOLING.");
    process.exit(1);
  }

  console.log("Connecting to Supabase...");
  const sql = postgres(url, { ssl: "require", max: 1 });

  try {
    console.log("Creating tables...");

    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password" varchar(256),
        "name" text,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "image" text,
        "isAnonymous" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;
    console.log("  ✓ User");

    await sql`
      CREATE TABLE IF NOT EXISTS "Chat" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamp NOT NULL,
        "title" text NOT NULL,
        "userId" uuid NOT NULL REFERENCES "User"("id"),
        "visibility" varchar NOT NULL DEFAULT 'private'
      )
    `;
    console.log("  ✓ Chat");

    await sql`
      CREATE TABLE IF NOT EXISTS "Message_v2" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
        "role" varchar NOT NULL,
        "parts" json NOT NULL,
        "attachments" json NOT NULL,
        "createdAt" timestamp NOT NULL
      )
    `;
    console.log("  ✓ Message_v2");

    await sql`
      CREATE TABLE IF NOT EXISTS "Vote_v2" (
        "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
        "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
        "isUpvoted" boolean NOT NULL,
        PRIMARY KEY ("chatId", "messageId")
      )
    `;
    console.log("  ✓ Vote_v2");

    await sql`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" timestamp NOT NULL,
        "title" text NOT NULL,
        "content" text,
        "text" varchar NOT NULL DEFAULT 'text',
        "userId" uuid NOT NULL REFERENCES "User"("id"),
        PRIMARY KEY ("id", "createdAt")
      )
    `;
    console.log("  ✓ Document");

    await sql`
      CREATE TABLE IF NOT EXISTS "Suggestion" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "documentId" uuid NOT NULL,
        "documentCreatedAt" timestamp NOT NULL,
        "originalText" text NOT NULL,
        "suggestedText" text NOT NULL,
        "description" text,
        "isResolved" boolean NOT NULL DEFAULT false,
        "userId" uuid NOT NULL REFERENCES "User"("id"),
        "createdAt" timestamp NOT NULL,
        FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
      )
    `;
    console.log("  ✓ Suggestion");

    await sql`
      CREATE TABLE IF NOT EXISTS "Stream" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
        "createdAt" timestamp NOT NULL
      )
    `;
    console.log("  ✓ Stream");

    await sql`
      CREATE TABLE IF NOT EXISTS "MessageReaction" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
        "userId" uuid REFERENCES "User"("id"),
        "emoji" varchar(10) NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;
    console.log("  ✓ MessageReaction");

    await sql`
      CREATE TABLE IF NOT EXISTS "ChatShare" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
        "shareToken" varchar(32) NOT NULL UNIQUE,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "expiresAt" timestamp
      )
    `;
    console.log("  ✓ ChatShare");

    await sql`
      CREATE TABLE IF NOT EXISTS "ChatMember" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
        "userId" uuid REFERENCES "User"("id"),
        "email" varchar(64),
        "role" varchar NOT NULL DEFAULT 'member',
        "joinedAt" timestamp NOT NULL DEFAULT now()
      )
    `;
    console.log("  ✓ ChatMember");

    await sql`
      CREATE TABLE IF NOT EXISTS "UserIntegration" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE REFERENCES "User"("id"),
        "fileName" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;
    console.log("  ✓ UserIntegration");

    console.log("\nAll tables created successfully!");
  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

runSetup();
