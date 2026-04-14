CREATE TABLE IF NOT EXISTS "UserIntegration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL DEFAULT 'system_prompt',
  "fileName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserIntegration_userId_type_key"
  ON "UserIntegration" ("userId", "type");
