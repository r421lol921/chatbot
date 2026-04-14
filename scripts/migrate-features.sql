-- Add tables for emoji reactions, share links, and group chat
-- Migration: Add new PeytOtoria features tables

-- MessageReaction table for emoji reactions
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES "Message_v2"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  emoji VARCHAR(10) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ChatShare table for public share links
CREATE TABLE IF NOT EXISTS "ChatShare" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  "shareToken" VARCHAR(32) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP
);

-- ChatMember table for group chat participants
CREATE TABLE IF NOT EXISTS "ChatMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" UUID NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  email VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("chatId", "userId")
);

-- Add isGroupChat column to Chat table to track group vs 1-on-1
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "isGroupChat" BOOLEAN DEFAULT false;
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "groupName" TEXT;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS "idx_message_reaction_message_id" ON "MessageReaction"("messageId");
CREATE INDEX IF NOT EXISTS "idx_chat_share_token" ON "ChatShare"("shareToken");
CREATE INDEX IF NOT EXISTS "idx_chat_member_chat_id" ON "ChatMember"("chatId");
CREATE INDEX IF NOT EXISTS "idx_chat_member_user_id" ON "ChatMember"("userId");
