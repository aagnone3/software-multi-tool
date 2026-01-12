-- Migration: add_pgboss_schema
-- Description: Creates the pgboss schema and tables for pg-boss job queue
-- Version: pg-boss 10.x compatible
--
-- Note: This migration creates the base pg-boss schema. pg-boss will create
-- additional partitions dynamically when queues are created. The pgboss
-- functions (create_queue, delete_queue) handle partition management.
--
-- After this migration, pg-boss should be started with:
--   migrate: false
--   createSchema: false

-- Wrap in advisory lock for safe concurrent migration
BEGIN;
SELECT pg_advisory_xact_lock(728374291);

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "pgboss";

-- CreateEnum for job states
CREATE TYPE "pgboss"."job_state" AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);

-- CreateTable: version (tracks pg-boss schema version and maintenance timestamps)
CREATE TABLE "pgboss"."version" (
    "version" INTEGER NOT NULL,
    "maintained_on" TIMESTAMP WITH TIME ZONE,
    "cron_on" TIMESTAMP WITH TIME ZONE,
    "monitored_on" TIMESTAMP WITH TIME ZONE,

    CONSTRAINT "version_pkey" PRIMARY KEY ("version")
);

-- Insert initial version (pg-boss v10.4.0 expects schema version 24)
INSERT INTO "pgboss"."version" ("version") VALUES (24);

-- CreateTable: queue (stores queue configuration)
CREATE TABLE "pgboss"."queue" (
    "name" TEXT NOT NULL,
    "policy" TEXT,
    "retry_limit" INTEGER,
    "retry_delay" INTEGER,
    "retry_backoff" BOOLEAN,
    "expire_seconds" INTEGER,
    "retention_minutes" INTEGER,
    "dead_letter" TEXT,
    "partition_name" TEXT,
    "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "queue_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey: queue self-reference for dead letter queues
ALTER TABLE "pgboss"."queue"
    ADD CONSTRAINT "queue_dead_letter_fkey"
    FOREIGN KEY ("dead_letter") REFERENCES "pgboss"."queue"("name");

-- CreateTable: schedule (stores cron job schedules)
CREATE TABLE "pgboss"."schedule" (
    "name" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "timezone" TEXT,
    "data" JSONB,
    "options" JSONB,
    "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey: schedule references queue
ALTER TABLE "pgboss"."schedule"
    ADD CONSTRAINT "schedule_name_fkey"
    FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;

-- CreateTable: subscription (stores event subscriptions)
CREATE TABLE "pgboss"."subscription" (
    "event" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("event", "name")
);

-- AddForeignKey: subscription references queue
ALTER TABLE "pgboss"."subscription"
    ADD CONSTRAINT "subscription_name_fkey"
    FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;

-- CreateTable: job (partitioned by queue name)
-- This is the parent table for all job partitions
CREATE TABLE "pgboss"."job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "state" "pgboss"."job_state" NOT NULL DEFAULT 'created'::"pgboss"."job_state",
    "retry_limit" INTEGER NOT NULL DEFAULT 2,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "retry_delay" INTEGER NOT NULL DEFAULT 0,
    "retry_backoff" BOOLEAN NOT NULL DEFAULT false,
    "start_after" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "started_on" TIMESTAMP WITH TIME ZONE,
    "singleton_key" TEXT,
    "singleton_on" TIMESTAMP WITHOUT TIME ZONE,
    "expire_in" INTERVAL NOT NULL DEFAULT '00:15:00'::interval,
    "created_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "completed_on" TIMESTAMP WITH TIME ZONE,
    "keep_until" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '14 days'::interval),
    "output" JSONB,
    "dead_letter" TEXT,
    "policy" TEXT
) PARTITION BY LIST ("name");

-- CreateIndex: job primary key (composite on name, id for partitioning)
CREATE UNIQUE INDEX "job_pkey" ON "pgboss"."job" ("name", "id");

-- CreateTable: archive (stores completed/failed jobs after retention period)
CREATE TABLE "pgboss"."archive" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "data" JSONB,
    "state" "pgboss"."job_state" NOT NULL,
    "retry_limit" INTEGER NOT NULL,
    "retry_count" INTEGER NOT NULL,
    "retry_delay" INTEGER NOT NULL,
    "retry_backoff" BOOLEAN NOT NULL,
    "start_after" TIMESTAMP WITH TIME ZONE NOT NULL,
    "started_on" TIMESTAMP WITH TIME ZONE,
    "singleton_key" TEXT,
    "singleton_on" TIMESTAMP WITHOUT TIME ZONE,
    "expire_in" INTERVAL NOT NULL,
    "created_on" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completed_on" TIMESTAMP WITH TIME ZONE,
    "keep_until" TIMESTAMP WITH TIME ZONE NOT NULL,
    "output" JSONB,
    "dead_letter" TEXT,
    "policy" TEXT,
    "archived_on" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT "archive_pkey" PRIMARY KEY ("name", "id")
);

-- CreateIndex: archive index for cleanup
CREATE INDEX "archive_i1" ON "pgboss"."archive" ("archived_on");

-- CreateFunction: create_queue
-- Dynamically creates a partition table for a new queue
CREATE FUNCTION "pgboss"."create_queue"(queue_name text, options json) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
      queue_created_on timestamptz;
    BEGIN

      WITH q as (
      INSERT INTO pgboss.queue (
        name,
        policy,
        retry_limit,
        retry_delay,
        retry_backoff,
        expire_seconds,
        retention_minutes,
        dead_letter,
        partition_name
      )
      VALUES (
        queue_name,
        options->>'policy',
        (options->>'retryLimit')::int,
        (options->>'retryDelay')::int,
        (options->>'retryBackoff')::bool,
        (options->>'expireInSeconds')::int,
        (options->>'retentionMinutes')::int,
        options->>'deadLetter',
        table_name
      )
      ON CONFLICT DO NOTHING
      RETURNING created_on
      )
      SELECT created_on into queue_created_on from q;

      IF queue_created_on IS NULL THEN
        RETURN;
      END IF;

      EXECUTE format('CREATE TABLE pgboss.%I (LIKE pgboss.job INCLUDING DEFAULTS)', table_name);

      EXECUTE format('ALTER TABLE pgboss.%1$I ADD PRIMARY KEY (name, id)', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON pgboss.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON pgboss.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
      EXECUTE format('CREATE INDEX %1$s_i5 ON pgboss.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);

      EXECUTE format('ALTER TABLE pgboss.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
      EXECUTE format('ALTER TABLE pgboss.job ATTACH PARTITION pgboss.%I FOR VALUES IN (%L)', table_name, queue_name);
    END;
    $_$;

-- CreateFunction: delete_queue
-- Removes a queue and its partition table
CREATE FUNCTION "pgboss"."delete_queue"(queue_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      table_name varchar;
    BEGIN
      WITH deleted as (
        DELETE FROM pgboss.queue
        WHERE name = queue_name
        RETURNING partition_name
      )
      SELECT partition_name from deleted INTO table_name;

      EXECUTE format('DROP TABLE IF EXISTS pgboss.%I', table_name);
    END;
    $$;

COMMIT;
