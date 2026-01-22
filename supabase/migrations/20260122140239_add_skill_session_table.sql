-- CreateTable
CREATE TABLE "public"."skill_session" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "toolSlug" TEXT,
    "jobId" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "context" JSONB NOT NULL DEFAULT '{}',
    "extractedData" JSONB,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_session_skillId_idx" ON "public"."skill_session"("skillId");

-- CreateIndex
CREATE INDEX "skill_session_userId_idx" ON "public"."skill_session"("userId");

-- CreateIndex
CREATE INDEX "skill_session_organizationId_idx" ON "public"."skill_session"("organizationId");

-- CreateIndex
CREATE INDEX "skill_session_toolSlug_idx" ON "public"."skill_session"("toolSlug");

-- CreateIndex
CREATE INDEX "skill_session_jobId_idx" ON "public"."skill_session"("jobId");

-- CreateIndex
CREATE INDEX "skill_session_isComplete_idx" ON "public"."skill_session"("isComplete");

-- Enable Row Level Security
-- Following the application data pattern: enable RLS without policies
-- Service role (used by Prisma) bypasses RLS automatically
-- All access goes through the API layer (Hono + oRPC), which handles authorization
ALTER TABLE "public"."skill_session" ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally:
-- - Service role (used by Prisma) bypasses RLS automatically
-- - Anonymous and authenticated roles have no access policies, so all access is denied
-- - All table access must go through the API layer (Hono + oRPC)
-- - Authorization logic (user ID matching) is enforced in the skill session queries
