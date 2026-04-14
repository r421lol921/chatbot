import os
import psycopg2

database_url = os.environ.get("POSTGRES_URL_NON_POOLING") or os.environ.get("POSTGRES_URL")

if not database_url:
    raise RuntimeError("No POSTGRES_URL environment variable found")

print(f"Connecting to database...")

conn = psycopg2.connect(database_url)
conn.autocommit = True
cur = conn.cursor()

sql = """
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
);

CREATE TABLE IF NOT EXISTS "Chat" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt"  timestamp NOT NULL,
  "title"      text NOT NULL,
  "userId"     uuid NOT NULL REFERENCES "User"("id"),
  "visibility" varchar NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public','private'))
);

CREATE TABLE IF NOT EXISTS "Message_v2" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId"      uuid NOT NULL REFERENCES "Chat"("id"),
  "role"        varchar NOT NULL,
  "parts"       json NOT NULL,
  "attachments" json NOT NULL,
  "createdAt"   timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "Vote_v2" (
  "chatId"    uuid NOT NULL REFERENCES "Chat"("id"),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "isUpvoted" boolean NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

CREATE TABLE IF NOT EXISTS "Document" (
  "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" timestamp NOT NULL,
  "title"     text NOT NULL,
  "content"   text,
  "text"      varchar NOT NULL DEFAULT 'text' CHECK ("text" IN ('text','code','image','sheet')),
  "userId"    uuid NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id", "createdAt")
);

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
);

CREATE TABLE IF NOT EXISTS "Stream" (
  "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
  "chatId"    uuid NOT NULL REFERENCES "Chat"("id"),
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
"""

cur.execute(sql)
print("All tables created successfully.")

# Verify tables exist
cur.execute("""
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
""")
tables = [row[0] for row in cur.fetchall()]
print(f"Tables in database: {tables}")

cur.close()
conn.close()
print("Migration complete.")
