-- Phase 3: Enable Row Level Security on organization/membership tables
-- This migration continues the RLS implementation for multi-tenancy tables.
--
-- Tables in scope:
-- - organization: contains org name, slug, billing info (risk: cross-org data exposure)
-- - member: contains org membership records (risk: membership enumeration)
-- - invitation: contains pending invites (risk: invite token exposure)
--
-- Since Better Auth uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to these tables via PostgREST while allowing Prisma/service role full access.

-- Enable RLS on organization table
ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on member table
ALTER TABLE "public"."member" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invitation table
ALTER TABLE "public"."invitation" ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally:
-- - Service role (used by Prisma/Better Auth) bypasses RLS automatically
-- - Anonymous and authenticated roles have no access policies, so all access is denied
-- This is the most secure configuration for organization/membership tables that should
-- never be accessed directly through the PostgREST API.
