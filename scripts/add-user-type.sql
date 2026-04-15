-- Add userType column to User table for persistent Plus subscriptions
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "userType" varchar(20) NOT NULL DEFAULT 'regular';

-- Add chat view count table for tracking public chat views
CREATE TABLE IF NOT EXISTS "ChatView" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "viewedAt" timestamp NOT NULL DEFAULT now()
);

-- Index for fast count queries
CREATE INDEX IF NOT EXISTS "ChatView_chatId_idx" ON "ChatView"("chatId");
