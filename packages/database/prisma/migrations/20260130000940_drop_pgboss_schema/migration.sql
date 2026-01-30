-- Migration: drop_pgboss_schema
-- Description: Drops the pg-boss schema and all related objects after migrating to Inngest
-- This migration removes all pg-boss infrastructure as part of the Render-to-Vercel migration
-- See: docs/research/job-platform-recommendation.md for migration rationale

-- Acquire transaction-scoped advisory lock for safe concurrent migration
SELECT pg_advisory_xact_lock(728374291);

-- Step 1: Drop the pgBossJobId column from tool_job table (removes FK reference)
DROP INDEX IF EXISTS "public"."tool_job_pgBossJobId_key";
ALTER TABLE "public"."tool_job" DROP COLUMN IF EXISTS "pgBossJobId";

-- Step 2: Drop dynamically created partition tables
-- pg-boss creates partitions with names like 'j' + sha224(queue_name)
-- We query the queue table to find all partition names
DO $$
DECLARE
    partition_name TEXT;
BEGIN
    -- Loop through all queue partition names and drop them
    FOR partition_name IN
        SELECT q.partition_name
        FROM pgboss.queue q
        WHERE q.partition_name IS NOT NULL
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS pgboss.%I CASCADE', partition_name);
    END LOOP;
END $$;

-- Step 3: Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS "pgboss"."subscription" CASCADE;
DROP TABLE IF EXISTS "pgboss"."schedule" CASCADE;

-- Step 4: Drop the partitioned job table (parent table)
DROP TABLE IF EXISTS "pgboss"."job" CASCADE;

-- Step 5: Drop remaining tables
DROP TABLE IF EXISTS "pgboss"."archive" CASCADE;
DROP TABLE IF EXISTS "pgboss"."queue" CASCADE;
DROP TABLE IF EXISTS "pgboss"."version" CASCADE;

-- Step 6: Drop functions
DROP FUNCTION IF EXISTS "pgboss"."create_queue"(text, json);
DROP FUNCTION IF EXISTS "pgboss"."delete_queue"(text);

-- Step 7: Drop the enum type
DROP TYPE IF EXISTS "pgboss"."job_state";

-- Step 8: Drop the schema itself
DROP SCHEMA IF EXISTS "pgboss" CASCADE;
