import postgres from "postgres";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Load env from .env.development.local
const envPath = path.resolve(__dirname, "../.env.development.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const connectionString = process.env.POSTGRES_URL ?? "";
if (!connectionString) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require", max: 1 });

async function migrate() {
  console.log("Running migrations...");

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
  console.log("Created User table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Chat" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "createdAt" timestamp NOT NULL,
      "title" text NOT NULL,
      "userId" uuid NOT NULL REFERENCES "User"("id"),
      "visibility" varchar NOT NULL DEFAULT 'private'
    )
  `;
  console.log("Created Chat table");

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
  console.log("Created Message_v2 table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Vote_v2" (
      "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
      "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
      "isUpvoted" boolean NOT NULL,
      PRIMARY KEY ("chatId", "messageId")
    )
  `;
  console.log("Created Vote_v2 table");

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
  console.log("Created Document table");

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
  console.log("Created Suggestion table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Stream" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "chatId" uuid NOT NULL,
      "createdAt" timestamp NOT NULL,
      FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
    )
  `;
  console.log("Created Stream table");

  await sql`
    CREATE TABLE IF NOT EXISTS "MessageReaction" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
      "userId" uuid REFERENCES "User"("id"),
      "emoji" varchar(10) NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log("Created MessageReaction table");

  await sql`
    CREATE TABLE IF NOT EXISTS "ChatShare" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
      "shareToken" varchar(32) NOT NULL UNIQUE,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "expiresAt" timestamp
    )
  `;
  console.log("Created ChatShare table");

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
  console.log("Created ChatMember table");

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
  console.log("Created UserIntegration table");

  console.log("All migrations completed successfully!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
