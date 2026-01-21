-- Phase 2: Enable Row Level Security on remaining authentication tables
-- This migration continues the RLS implementation for auth-related tables.
--
-- Tables in scope:
-- - user: contains email, name, role, ban status (risk: PII exposure)
-- - passkey: contains WebAuthn credentials (risk: credential theft)
-- - verification: contains email verification tokens (risk: token theft)
--
-- Since Better Auth uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to these tables via PostgREST while allowing Prisma/service role full access.

-- Enable RLS on user table
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on passkey table
ALTER TABLE "public"."passkey" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on verification table
ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally:
-- - Service role (used by Prisma/Better Auth) bypasses RLS automatically
-- - Anonymous and authenticated roles have no access policies, so all access is denied
-- This is the most secure configuration for sensitive auth tables that should
-- never be accessed directly through the PostgREST API.
