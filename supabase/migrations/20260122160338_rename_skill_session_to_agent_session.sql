-- Rename skill_session table to agent_session
ALTER TABLE "public"."skill_session" RENAME TO "agent_session";

-- Rename skillId column to sessionType
ALTER TABLE "public"."agent_session" RENAME COLUMN "skillId" TO "sessionType";

-- Drop old indexes and create new ones with updated names
DROP INDEX IF EXISTS "public"."skill_session_skillId_idx";
DROP INDEX IF EXISTS "public"."skill_session_userId_idx";
DROP INDEX IF EXISTS "public"."skill_session_organizationId_idx";
DROP INDEX IF EXISTS "public"."skill_session_toolSlug_idx";
DROP INDEX IF EXISTS "public"."skill_session_jobId_idx";
DROP INDEX IF EXISTS "public"."skill_session_isComplete_idx";

CREATE INDEX "agent_session_sessionType_idx" ON "public"."agent_session"("sessionType");
CREATE INDEX "agent_session_userId_idx" ON "public"."agent_session"("userId");
CREATE INDEX "agent_session_organizationId_idx" ON "public"."agent_session"("organizationId");
CREATE INDEX "agent_session_toolSlug_idx" ON "public"."agent_session"("toolSlug");
CREATE INDEX "agent_session_jobId_idx" ON "public"."agent_session"("jobId");
CREATE INDEX "agent_session_isComplete_idx" ON "public"."agent_session"("isComplete");
