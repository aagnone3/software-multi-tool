-- RenameConstraint
-- Rename the primary key constraint to match the renamed table
-- The table was renamed from skill_session to agent_session in migration 20260122160338
-- but the constraint name was not updated
ALTER TABLE "public"."agent_session" RENAME CONSTRAINT "skill_session_pkey" TO "agent_session_pkey";
