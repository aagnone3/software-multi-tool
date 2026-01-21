-- Phase 1: Enable Row Level Security on tables with sensitive columns
-- These tables contain sensitive authentication data that should not be
-- accessible via PostgREST (Supabase's REST API) to anonymous or authenticated roles.
--
-- Tables in scope:
-- - session: contains session tokens (risk: session hijacking)
-- - account: contains password hashes (risk: credential theft)
-- - twoFactor: contains 2FA secrets (risk: 2FA bypass)
--
-- Since Better Auth uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to these tables via PostgREST while allowing Prisma/service role full access.

-- Enable RLS on session table
ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on account table
ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on twoFactor table (note: case-sensitive table name with quotes)
ALTER TABLE "public"."twoFactor" ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally:
-- - Service role (used by Prisma/Better Auth) bypasses RLS automatically
-- - Anonymous and authenticated roles have no access policies, so all access is denied
-- This is the most secure configuration for sensitive auth tables that should
-- never be accessed directly through the PostgREST API.
