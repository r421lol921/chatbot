-- ============================================================
-- 004_supabase_schema_rls.sql
-- Full schema creation + RLS policies + auto-create User trigger.
-- Safe to re-run (IF NOT EXISTS / OR REPLACE throughout).
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

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType"  VARCHAR(20)  NOT NULL DEFAULT 'regular';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW();
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW();

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

-- ─── Chat views ──────────────────────────────────────────────
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

-- ============================================================
-- TRIGGER: auto-create "User" row when Supabase Auth creates a user
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "User" ("id", "email", "emailVerified", "isAnonymous", "userType", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    (NEW.email_confirmed_at IS NOT NULL),
    (NEW.is_anonymous IS TRUE),
    'regular',
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO UPDATE SET
    "email"         = COALESCE(EXCLUDED."email", "User"."email"),
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt"     = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

-- User table: users can only read/update their own row
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_select_own"  ON "User";
DROP POLICY IF EXISTS "user_update_own"  ON "User";
DROP POLICY IF EXISTS "user_insert_own"  ON "User";
CREATE POLICY "user_select_own"  ON "User" FOR SELECT USING (auth.uid() = "id");
CREATE POLICY "user_update_own"  ON "User" FOR UPDATE USING (auth.uid() = "id");
CREATE POLICY "user_insert_own"  ON "User" FOR INSERT WITH CHECK (auth.uid() = "id");

-- Chat table: users manage their own chats; public chats visible to all
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_owner_all"   ON "Chat";
DROP POLICY IF EXISTS "chat_public_read" ON "Chat";
CREATE POLICY "chat_owner_all"   ON "Chat" FOR ALL    USING (auth.uid() = "userId");
CREATE POLICY "chat_public_read" ON "Chat" FOR SELECT USING ("visibility" = 'public');

-- ChatView: anyone can insert; owner can select
ALTER TABLE "ChatView" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chatview_insert_all"  ON "ChatView";
DROP POLICY IF EXISTS "chatview_select_own"  ON "ChatView";
CREATE POLICY "chatview_insert_all"  ON "ChatView" FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "chatview_select_own"  ON "ChatView" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);

-- Message_v2: access scoped to chat owner
ALTER TABLE "Message_v2" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "message_owner_all" ON "Message_v2";
CREATE POLICY "message_owner_all" ON "Message_v2" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);

-- Vote_v2: scoped to chat owner
ALTER TABLE "Vote_v2" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vote_owner_all" ON "Vote_v2";
CREATE POLICY "vote_owner_all" ON "Vote_v2" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);

-- Document: owner only
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_owner_all" ON "Document";
CREATE POLICY "document_owner_all" ON "Document" FOR ALL USING (auth.uid() = "userId");

-- Suggestion: owner only (via document)
ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suggestion_owner_all" ON "Suggestion";
CREATE POLICY "suggestion_owner_all" ON "Suggestion" FOR ALL USING (auth.uid() = "userId");

-- Stream: scoped to chat owner
ALTER TABLE "Stream" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stream_owner_all" ON "Stream";
CREATE POLICY "stream_owner_all" ON "Stream" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);

-- MessageReaction: authenticated users can manage their own reactions
ALTER TABLE "MessageReaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reaction_select_all"  ON "MessageReaction";
DROP POLICY IF EXISTS "reaction_insert_own"  ON "MessageReaction";
DROP POLICY IF EXISTS "reaction_delete_own"  ON "MessageReaction";
CREATE POLICY "reaction_select_all"  ON "MessageReaction" FOR SELECT USING (TRUE);
CREATE POLICY "reaction_insert_own"  ON "MessageReaction" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "reaction_delete_own"  ON "MessageReaction" FOR DELETE USING (auth.uid() = "userId");

-- ChatShare: owner can manage; anyone can read by token (handled in app layer)
ALTER TABLE "ChatShare" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chatshare_owner_all"   ON "ChatShare";
DROP POLICY IF EXISTS "chatshare_token_read"  ON "ChatShare";
CREATE POLICY "chatshare_owner_all"   ON "ChatShare" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);
CREATE POLICY "chatshare_token_read"  ON "ChatShare" FOR SELECT USING (TRUE);

-- ChatMember: owner manages; members can view
ALTER TABLE "ChatMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chatmember_owner_all"   ON "ChatMember";
DROP POLICY IF EXISTS "chatmember_member_read" ON "ChatMember";
CREATE POLICY "chatmember_owner_all"   ON "ChatMember" FOR ALL USING (
  EXISTS (SELECT 1 FROM "Chat" WHERE "Chat"."id" = "chatId" AND "Chat"."userId" = auth.uid())
);
CREATE POLICY "chatmember_member_read" ON "ChatMember" FOR SELECT USING (auth.uid() = "userId");

-- UserIntegration: owner only
ALTER TABLE "UserIntegration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "userintegration_owner_all" ON "UserIntegration";
CREATE POLICY "userintegration_owner_all" ON "UserIntegration" FOR ALL USING (auth.uid() = "userId");
