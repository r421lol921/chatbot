CREATE TABLE IF NOT EXISTS "Game" (
  "id" varchar(12) PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "html" text NOT NULL,
  "userId" uuid REFERENCES "User"("id"),
  "chatId" uuid REFERENCES "Chat"("id"),
  "shareToken" varchar(32) NOT NULL UNIQUE,
  "plays" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
