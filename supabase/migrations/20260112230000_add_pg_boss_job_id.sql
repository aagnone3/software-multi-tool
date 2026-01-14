-- Migration: add_pg_boss_job_id
-- Description: Add pgBossJobId field to ToolJob for linking to pg-boss jobs
-- Part of PRA-82: Migrate job processing from Vercel cron to pg-boss workers

-- AlterTable: Add pgBossJobId column
ALTER TABLE "public"."tool_job" ADD COLUMN "pgBossJobId" TEXT;

-- CreateIndex: Unique constraint on pgBossJobId
CREATE UNIQUE INDEX "tool_job_pgBossJobId_key" ON "public"."tool_job"("pgBossJobId");
