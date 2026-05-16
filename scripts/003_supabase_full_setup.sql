-- ============================================================
-- 003_supabase_full_setup.sql
-- Full idempotent schema — safe to re-run against Supabase.
-- Creates all tables if missing, and adds columns that were
-- added after the initial migration.
-- ============================================================

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
  "id"            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         VARCHAR(255)  NOT NULL,
  "password"      VARCHAR(256),
  "name"          TEXT,
  "emailVerified" BOOLEAN       NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "isAnonymous"   BOOLEAN       NOT NULL DEFAULT FALSE,
  "userType"      VARCHAR(20)   NOT NULL DEFAULT 'regular',
  "createdAt"     TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing from an older run
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType"  VARCHAR(20)  NOT NULL DEFAULT 'regular';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW();
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW();
-- Widen email/password columns in case they were created narrow
DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "email"    TYPE VARCHAR(255);
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "password" TYPE VARCHAR(256);
EXCEPTION WHEN others THEN NULL; END $$;

-- ─── Chats ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Chat" (
  "id"         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"  TIMESTAMP NOT NULL,
  "title"      TEXT      NOT NULL,
  "userId"     UUID      NOT NULL REFERENCES "User"("id"),
  "visibility" VARCHAR   NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public','private')),
  "viewCount"  INTEGER   NOT NULL DEFAULT 0
);

ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- ─── Chat views (analytics) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChatView" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"    UUID        NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "viewedAt"  TIMESTAMP   NOT NULL DEFAULT NOW(),
  "visitorId" VARCHAR(64)
);

-- ─── Messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id"          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"      UUID      NOT NULL REFERENCES "Chat"("id"),
  "role"        VARCHAR   NOT NULL,
  "parts"       JSON      NOT NULL,
  "attachments" JSON      NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL
);

-- ─── Votes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId"    UUID    NOT NULL REFERENCES "Chat"("id"),
  "messageId" UUID    NOT NULL REFERENCES "Message_v2"("id"),
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId","messageId")
);

-- ─── Documents ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Document" (
  "id"        UUID      NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  "title"     TEXT      NOT NULL,
  "content"   TEXT,
  "text"      VARCHAR   NOT NULL DEFAULT 'text' CHECK ("text" IN ('text','code','image','sheet')),
  "userId"    UUID      NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id","createdAt")
);

-- ─── Suggestions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id"                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId"        UUID      NOT NULL,
  "documentCreatedAt" TIMESTAMP NOT NULL,
  "originalText"      TEXT      NOT NULL,
  "suggestedText"     TEXT      NOT NULL,
  "description"       TEXT,
  "isResolved"        BOOLEAN   NOT NULL DEFAULT FALSE,
  "userId"            UUID      NOT NULL REFERENCES "User"("id"),
  "createdAt"         TIMESTAMP NOT NULL,
  FOREIGN KEY ("documentId","documentCreatedAt") REFERENCES "Document"("id","createdAt")
);

-- ─── Streams ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Stream" (
  "id"        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"    UUID      NOT NULL REFERENCES "Chat"("id"),
  "createdAt" TIMESTAMP NOT NULL
);

-- ─── Message reactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID        NOT NULL REFERENCES "Message_v2"("id"),
  "userId"    UUID        REFERENCES "User"("id"),
  "emoji"     VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── Chat share links ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChatShare" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"     UUID        NOT NULL REFERENCES "Chat"("id"),
  "shareToken" VARCHAR(32) NOT NULL UNIQUE,
  "createdAt"  TIMESTAMP   NOT NULL DEFAULT NOW(),
  "expiresAt"  TIMESTAMP
);

-- ─── Chat members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChatMember" (
  "id"       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"   UUID        NOT NULL REFERENCES "Chat"("id"),
  "userId"   UUID        REFERENCES "User"("id"),
  "email"    VARCHAR(64),
  "role"     VARCHAR     NOT NULL DEFAULT 'member' CHECK ("role" IN ('member','owner')),
  "joinedAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── User integrations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserIntegration" (
  "id"        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID          NOT NULL UNIQUE REFERENCES "User"("id"),
  "fileName"  VARCHAR(255)  NOT NULL,
  "content"   TEXT          NOT NULL,
  "createdAt" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP     NOT NULL DEFAULT NOW()
);
