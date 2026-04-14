-- ============================================================
-- 001_setup_schema.sql
-- Full schema for the chatbot app — run against Supabase Postgres
-- ============================================================

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         VARCHAR(64) NOT NULL,
  "password"      VARCHAR(64),
  "name"          TEXT,
  "emailVerified" BOOLEAN     NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "isAnonymous"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Chat table
CREATE TABLE IF NOT EXISTS "Chat" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt"  TIMESTAMP   NOT NULL,
  "title"      TEXT        NOT NULL,
  "userId"     UUID        NOT NULL REFERENCES "User"("id"),
  "visibility" VARCHAR     NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public', 'private'))
);

-- Message_v2 table
CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id"          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"      UUID      NOT NULL REFERENCES "Chat"("id"),
  "role"        VARCHAR   NOT NULL,
  "parts"       JSON      NOT NULL,
  "attachments" JSON      NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL
);

-- Vote_v2 table
CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId"    UUID    NOT NULL REFERENCES "Chat"("id"),
  "messageId" UUID    NOT NULL REFERENCES "Message_v2"("id"),
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

-- Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id"        UUID      NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL,
  "title"     TEXT      NOT NULL,
  "content"   TEXT,
  "text"      VARCHAR   NOT NULL DEFAULT 'text' CHECK ("text" IN ('text', 'code', 'image', 'sheet')),
  "userId"    UUID      NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id", "createdAt")
);

-- Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id"                  UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId"          UUID      NOT NULL,
  "documentCreatedAt"   TIMESTAMP NOT NULL,
  "originalText"        TEXT      NOT NULL,
  "suggestedText"       TEXT      NOT NULL,
  "description"         TEXT,
  "isResolved"          BOOLEAN   NOT NULL DEFAULT FALSE,
  "userId"              UUID      NOT NULL REFERENCES "User"("id"),
  "createdAt"           TIMESTAMP NOT NULL,
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
);

-- Stream table
CREATE TABLE IF NOT EXISTS "Stream" (
  "id"        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"    UUID      NOT NULL REFERENCES "Chat"("id"),
  "createdAt" TIMESTAMP NOT NULL
);

-- MessageReaction table
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID        NOT NULL REFERENCES "Message_v2"("id"),
  "userId"    UUID        REFERENCES "User"("id"),
  "emoji"     VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ChatShare table
CREATE TABLE IF NOT EXISTS "ChatShare" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"     UUID        NOT NULL REFERENCES "Chat"("id"),
  "shareToken" VARCHAR(32) NOT NULL UNIQUE,
  "createdAt"  TIMESTAMP   NOT NULL DEFAULT NOW(),
  "expiresAt"  TIMESTAMP
);

-- ChatMember table
CREATE TABLE IF NOT EXISTS "ChatMember" (
  "id"       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId"   UUID        NOT NULL REFERENCES "Chat"("id"),
  "userId"   UUID        REFERENCES "User"("id"),
  "email"    VARCHAR(64),
  "role"     VARCHAR     NOT NULL DEFAULT 'member' CHECK ("role" IN ('member', 'owner')),
  "joinedAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);
