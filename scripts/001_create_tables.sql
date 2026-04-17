-- Migration 001: Create core tables for chat persistence
-- Tables: User, Chat, Message_v2, Vote_v2, Stream, Document, Suggestion, ChatShare, ChatMember, UserIntegration, MessageReaction, ChatView

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "password" varchar(256),
  "name" text,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "isAnonymous" boolean NOT NULL DEFAULT false,
  "userType" varchar(20) NOT NULL DEFAULT 'regular',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Chat table
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp NOT NULL,
  "title" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "visibility" varchar NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public', 'private')),
  "viewCount" integer NOT NULL DEFAULT 0
);

-- Message_v2 table
CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "role" varchar NOT NULL,
  "parts" json NOT NULL,
  "attachments" json NOT NULL,
  "createdAt" timestamp NOT NULL
);

-- Vote_v2 table
CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "isUpvoted" boolean NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

-- Stream table
CREATE TABLE IF NOT EXISTS "Stream" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL,
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
);

-- Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "text" varchar NOT NULL DEFAULT 'text' CHECK ("text" IN ('text', 'code', 'image', 'sheet')),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id", "createdAt")
);

-- Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "documentId" uuid NOT NULL,
  "documentCreatedAt" timestamp NOT NULL,
  "originalText" text NOT NULL,
  "suggestedText" text NOT NULL,
  "description" text,
  "isResolved" boolean NOT NULL DEFAULT false,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
);

-- ChatView table
CREATE TABLE IF NOT EXISTS "ChatView" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "viewedAt" timestamp NOT NULL DEFAULT now(),
  "visitorId" varchar(64)
);

-- MessageReaction table
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "userId" uuid REFERENCES "User"("id"),
  "emoji" varchar(10) NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- ChatShare table
CREATE TABLE IF NOT EXISTS "ChatShare" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "shareToken" varchar(32) NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "expiresAt" timestamp
);

-- ChatMember table
CREATE TABLE IF NOT EXISTS "ChatMember" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "userId" uuid REFERENCES "User"("id"),
  "email" varchar(64),
  "role" varchar NOT NULL DEFAULT 'member' CHECK ("role" IN ('member', 'owner')),
  "joinedAt" timestamp NOT NULL DEFAULT now()
);

-- UserIntegration table
CREATE TABLE IF NOT EXISTS "UserIntegration" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES "User"("id"),
  "fileName" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Sync Supabase auth users into our User table on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "User" ("id", "email", "emailVerified", "isAnonymous")
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
