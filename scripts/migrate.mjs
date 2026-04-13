import { sql } from "@vercel/postgres";

async function migrate() {
  console.log("[v0] Running Lio 1.0 database migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "email"         varchar(64) NOT NULL,
      "password"      varchar(64),
      "name"          text,
      "emailVerified" boolean NOT NULL DEFAULT false,
      "image"         text,
      "isAnonymous"   boolean NOT NULL DEFAULT false,
      "createdAt"     timestamp NOT NULL DEFAULT now(),
      "updatedAt"     timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log("[v0] Created User table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Chat" (
      "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "createdAt"  timestamp NOT NULL,
      "title"      text NOT NULL,
      "userId"     uuid NOT NULL REFERENCES "User"("id"),
      "visibility" varchar NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public','private'))
    )
  `;
  console.log("[v0] Created Chat table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Message_v2" (
      "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "chatId"      uuid NOT NULL REFERENCES "Chat"("id"),
      "role"        varchar NOT NULL,
      "parts"       json NOT NULL,
      "attachments" json NOT NULL,
      "createdAt"   timestamp NOT NULL
    )
  `;
  console.log("[v0] Created Message_v2 table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Vote_v2" (
      "chatId"    uuid NOT NULL REFERENCES "Chat"("id"),
      "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
      "isUpvoted" boolean NOT NULL,
      PRIMARY KEY ("chatId", "messageId")
    )
  `;
  console.log("[v0] Created Vote_v2 table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Document" (
      "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
      "createdAt" timestamp NOT NULL,
      "title"     text NOT NULL,
      "content"   text,
      "text"      varchar NOT NULL DEFAULT 'text' CHECK ("text" IN ('text','code','image','sheet')),
      "userId"    uuid NOT NULL REFERENCES "User"("id"),
      PRIMARY KEY ("id", "createdAt")
    )
  `;
  console.log("[v0] Created Document table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Suggestion" (
      "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "documentId"          uuid NOT NULL,
      "documentCreatedAt"   timestamp NOT NULL,
      "originalText"        text NOT NULL,
      "suggestedText"       text NOT NULL,
      "description"         text,
      "isResolved"          boolean NOT NULL DEFAULT false,
      "userId"              uuid NOT NULL REFERENCES "User"("id"),
      "createdAt"           timestamp NOT NULL,
      FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
    )
  `;
  console.log("[v0] Created Suggestion table");

  await sql`
    CREATE TABLE IF NOT EXISTS "Stream" (
      "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
      "chatId"    uuid NOT NULL REFERENCES "Chat"("id"),
      "createdAt" timestamp NOT NULL,
      PRIMARY KEY ("id")
    )
  `;
  console.log("[v0] Created Stream table");

  console.log("[v0] Migration complete!");
}

migrate().catch((err) => {
  console.error("[v0] Migration failed:", err);
  process.exit(1);
});
