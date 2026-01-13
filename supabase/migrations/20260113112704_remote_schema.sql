


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "pgboss";


ALTER SCHEMA "pgboss" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "pgboss"."job_state" AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE "pgboss"."job_state" OWNER TO "postgres";


CREATE TYPE "public"."PurchaseType" AS ENUM (
    'SUBSCRIPTION',
    'ONE_TIME'
);


ALTER TYPE "public"."PurchaseType" OWNER TO "postgres";


CREATE TYPE "public"."ToolJobStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE "public"."ToolJobStatus" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgboss"."create_queue"("queue_name" "text", "options" json) RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "pgboss"."create_queue"("queue_name" "text", "options" json) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "pgboss"."delete_queue"("queue_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "pgboss"."delete_queue"("queue_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "pgboss"."archive" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "priority" integer NOT NULL,
    "data" "jsonb",
    "state" "pgboss"."job_state" NOT NULL,
    "retry_limit" integer NOT NULL,
    "retry_count" integer NOT NULL,
    "retry_delay" integer NOT NULL,
    "retry_backoff" boolean NOT NULL,
    "start_after" timestamp with time zone NOT NULL,
    "started_on" timestamp with time zone,
    "singleton_key" "text",
    "singleton_on" timestamp without time zone,
    "expire_in" interval NOT NULL,
    "created_on" timestamp with time zone NOT NULL,
    "completed_on" timestamp with time zone,
    "keep_until" timestamp with time zone NOT NULL,
    "output" "jsonb",
    "dead_letter" "text",
    "policy" "text",
    "archived_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."archive" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "pgboss"."job" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "data" "jsonb",
    "state" "pgboss"."job_state" DEFAULT 'created'::"pgboss"."job_state" NOT NULL,
    "retry_limit" integer DEFAULT 2 NOT NULL,
    "retry_count" integer DEFAULT 0 NOT NULL,
    "retry_delay" integer DEFAULT 0 NOT NULL,
    "retry_backoff" boolean DEFAULT false NOT NULL,
    "start_after" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_on" timestamp with time zone,
    "singleton_key" "text",
    "singleton_on" timestamp without time zone,
    "expire_in" interval DEFAULT '00:15:00'::interval NOT NULL,
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_on" timestamp with time zone,
    "keep_until" timestamp with time zone DEFAULT ("now"() + '14 days'::interval) NOT NULL,
    "output" "jsonb",
    "dead_letter" "text",
    "policy" "text"
)
PARTITION BY LIST ("name");


ALTER TABLE "pgboss"."job" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "pgboss"."queue" (
    "name" "text" NOT NULL,
    "policy" "text",
    "retry_limit" integer,
    "retry_delay" integer,
    "retry_backoff" boolean,
    "expire_seconds" integer,
    "retention_minutes" integer,
    "dead_letter" "text",
    "partition_name" "text",
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "pgboss"."schedule" (
    "name" "text" NOT NULL,
    "cron" "text" NOT NULL,
    "timezone" "text",
    "data" "jsonb",
    "options" "jsonb",
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "pgboss"."subscription" (
    "event" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_on" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_on" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "pgboss"."subscription" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "pgboss"."version" (
    "version" integer NOT NULL,
    "maintained_on" timestamp with time zone,
    "cron_on" timestamp with time zone,
    "monitored_on" timestamp with time zone
);


ALTER TABLE "pgboss"."version" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account" (
    "id" "text" NOT NULL,
    "accountId" "text" NOT NULL,
    "providerId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "accessToken" "text",
    "refreshToken" "text",
    "idToken" "text",
    "expiresAt" timestamp(3) without time zone,
    "password" "text",
    "accessTokenExpiresAt" timestamp(3) without time zone,
    "refreshTokenExpiresAt" timestamp(3) without time zone,
    "scope" "text",
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_chat" (
    "id" "text" NOT NULL,
    "organizationId" "text",
    "userId" "text",
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ai_chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text",
    "status" "text" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "inviterId" "text" NOT NULL
);


ALTER TABLE "public"."invitation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "role" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "logo" "text",
    "createdAt" timestamp(3) without time zone NOT NULL,
    "metadata" "text",
    "paymentsCustomerId" "text"
);


ALTER TABLE "public"."organization" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."passkey" (
    "id" "text" NOT NULL,
    "name" "text",
    "publicKey" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "credentialID" "text" NOT NULL,
    "counter" integer NOT NULL,
    "deviceType" "text" NOT NULL,
    "backedUp" boolean NOT NULL,
    "transports" "text",
    "createdAt" timestamp(3) without time zone,
    "aaguid" "text"
);


ALTER TABLE "public"."passkey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase" (
    "id" "text" NOT NULL,
    "organizationId" "text",
    "userId" "text",
    "type" "public"."PurchaseType" NOT NULL,
    "customerId" "text" NOT NULL,
    "subscriptionId" "text",
    "productId" "text" NOT NULL,
    "status" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."purchase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_entry" (
    "id" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "toolSlug" "text" NOT NULL,
    "windowStart" timestamp(3) without time zone NOT NULL,
    "windowEnd" timestamp(3) without time zone NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."rate_limit_entry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session" (
    "id" "text" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "ipAddress" "text",
    "userAgent" "text",
    "userId" "text" NOT NULL,
    "impersonatedBy" "text",
    "activeOrganizationId" "text",
    "token" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_job" (
    "id" "text" NOT NULL,
    "toolSlug" "text" NOT NULL,
    "status" "public"."ToolJobStatus" DEFAULT 'PENDING'::"public"."ToolJobStatus" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "input" "jsonb" NOT NULL,
    "output" "jsonb",
    "error" "text",
    "userId" "text",
    "sessionId" "text",
    "attempts" integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 3 NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "pgBossJobId" "text"
);


ALTER TABLE "public"."tool_job" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."twoFactor" (
    "id" "text" NOT NULL,
    "secret" "text" NOT NULL,
    "backupCodes" "text" NOT NULL,
    "userId" "text" NOT NULL
);


ALTER TABLE "public"."twoFactor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "emailVerified" boolean NOT NULL,
    "image" "text",
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "username" "text",
    "role" "text",
    "banned" boolean,
    "banReason" "text",
    "banExpires" timestamp(3) without time zone,
    "onboardingComplete" boolean DEFAULT false NOT NULL,
    "paymentsCustomerId" "text",
    "locale" "text",
    "twoFactorEnabled" boolean
);


ALTER TABLE "public"."user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification" (
    "id" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "value" "text" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone
);


ALTER TABLE "public"."verification" OWNER TO "postgres";


ALTER TABLE ONLY "pgboss"."archive"
    ADD CONSTRAINT "archive_pkey" PRIMARY KEY ("name", "id");



ALTER TABLE ONLY "pgboss"."queue"
    ADD CONSTRAINT "queue_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "pgboss"."schedule"
    ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "pgboss"."subscription"
    ADD CONSTRAINT "subscription_pkey" PRIMARY KEY ("event", "name");



ALTER TABLE ONLY "pgboss"."version"
    ADD CONSTRAINT "version_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_chat"
    ADD CONSTRAINT "ai_chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member"
    ADD CONSTRAINT "member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."passkey"
    ADD CONSTRAINT "passkey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase"
    ADD CONSTRAINT "purchase_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_entry"
    ADD CONSTRAINT "rate_limit_entry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_job"
    ADD CONSTRAINT "tool_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."twoFactor"
    ADD CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification"
    ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");



CREATE INDEX "archive_i1" ON "pgboss"."archive" USING "btree" ("archived_on");



CREATE UNIQUE INDEX "job_pkey" ON ONLY "pgboss"."job" USING "btree" ("name", "id");



CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "public"."member" USING "btree" ("organizationId", "userId");



CREATE UNIQUE INDEX "organization_slug_key" ON "public"."organization" USING "btree" ("slug");



CREATE INDEX "purchase_subscriptionId_idx" ON "public"."purchase" USING "btree" ("subscriptionId");



CREATE UNIQUE INDEX "purchase_subscriptionId_key" ON "public"."purchase" USING "btree" ("subscriptionId");



CREATE INDEX "rate_limit_entry_identifier_toolSlug_idx" ON "public"."rate_limit_entry" USING "btree" ("identifier", "toolSlug");



CREATE UNIQUE INDEX "rate_limit_entry_identifier_toolSlug_windowStart_key" ON "public"."rate_limit_entry" USING "btree" ("identifier", "toolSlug", "windowStart");



CREATE INDEX "rate_limit_entry_windowEnd_idx" ON "public"."rate_limit_entry" USING "btree" ("windowEnd");



CREATE UNIQUE INDEX "session_token_key" ON "public"."session" USING "btree" ("token");



CREATE INDEX "tool_job_expiresAt_idx" ON "public"."tool_job" USING "btree" ("expiresAt");



CREATE UNIQUE INDEX "tool_job_pgBossJobId_key" ON "public"."tool_job" USING "btree" ("pgBossJobId");



CREATE INDEX "tool_job_sessionId_idx" ON "public"."tool_job" USING "btree" ("sessionId");



CREATE INDEX "tool_job_status_priority_idx" ON "public"."tool_job" USING "btree" ("status", "priority");



CREATE INDEX "tool_job_toolSlug_status_idx" ON "public"."tool_job" USING "btree" ("toolSlug", "status");



CREATE INDEX "tool_job_userId_idx" ON "public"."tool_job" USING "btree" ("userId");



CREATE UNIQUE INDEX "user_email_key" ON "public"."user" USING "btree" ("email");



CREATE UNIQUE INDEX "user_username_key" ON "public"."user" USING "btree" ("username");



ALTER TABLE ONLY "pgboss"."queue"
    ADD CONSTRAINT "queue_dead_letter_fkey" FOREIGN KEY ("dead_letter") REFERENCES "pgboss"."queue"("name");



ALTER TABLE ONLY "pgboss"."schedule"
    ADD CONSTRAINT "schedule_name_fkey" FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "pgboss"."subscription"
    ADD CONSTRAINT "subscription_name_fkey" FOREIGN KEY ("name") REFERENCES "pgboss"."queue"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chat"
    ADD CONSTRAINT "ai_chat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_chat"
    ADD CONSTRAINT "ai_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation"
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member"
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member"
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."passkey"
    ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase"
    ADD CONSTRAINT "purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase"
    ADD CONSTRAINT "purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_job"
    ADD CONSTRAINT "tool_job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."twoFactor"
    ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."account" TO "anon";
GRANT ALL ON TABLE "public"."account" TO "authenticated";
GRANT ALL ON TABLE "public"."account" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chat" TO "anon";
GRANT ALL ON TABLE "public"."ai_chat" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chat" TO "service_role";



GRANT ALL ON TABLE "public"."invitation" TO "anon";
GRANT ALL ON TABLE "public"."invitation" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation" TO "service_role";



GRANT ALL ON TABLE "public"."member" TO "anon";
GRANT ALL ON TABLE "public"."member" TO "authenticated";
GRANT ALL ON TABLE "public"."member" TO "service_role";



GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";



GRANT ALL ON TABLE "public"."passkey" TO "anon";
GRANT ALL ON TABLE "public"."passkey" TO "authenticated";
GRANT ALL ON TABLE "public"."passkey" TO "service_role";



GRANT ALL ON TABLE "public"."purchase" TO "anon";
GRANT ALL ON TABLE "public"."purchase" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_entry" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_entry" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_entry" TO "service_role";



GRANT ALL ON TABLE "public"."session" TO "anon";
GRANT ALL ON TABLE "public"."session" TO "authenticated";
GRANT ALL ON TABLE "public"."session" TO "service_role";



GRANT ALL ON TABLE "public"."tool_job" TO "anon";
GRANT ALL ON TABLE "public"."tool_job" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_job" TO "service_role";



GRANT ALL ON TABLE "public"."twoFactor" TO "anon";
GRANT ALL ON TABLE "public"."twoFactor" TO "authenticated";
GRANT ALL ON TABLE "public"."twoFactor" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."verification" TO "anon";
GRANT ALL ON TABLE "public"."verification" TO "authenticated";
GRANT ALL ON TABLE "public"."verification" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";
