-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "public"."ToolJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."tool_job" (
    "id" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "status" "public"."ToolJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."rate_limit_entry" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_job_status_priority_idx" ON "public"."tool_job"("status", "priority");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_job_toolSlug_status_idx" ON "public"."tool_job"("toolSlug", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_job_userId_idx" ON "public"."tool_job"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_job_sessionId_idx" ON "public"."tool_job"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tool_job_expiresAt_idx" ON "public"."tool_job"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_entry_identifier_toolSlug_windowStart_key" ON "public"."rate_limit_entry"("identifier", "toolSlug", "windowStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rate_limit_entry_identifier_toolSlug_idx" ON "public"."rate_limit_entry"("identifier", "toolSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rate_limit_entry_windowEnd_idx" ON "public"."rate_limit_entry"("windowEnd");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "public"."tool_job" ADD CONSTRAINT "tool_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
