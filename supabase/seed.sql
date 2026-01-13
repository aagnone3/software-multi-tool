-- Supabase Preview Branch Seed Data
-- This seed file runs automatically on preview branch creation
-- Creates a test tenant (organization) and user for preview environment testing
--
-- Note: Uses better-auth for authentication, not Supabase Auth
-- See .claude/skills/better-auth/ for auth implementation details

-- =====================================================
-- Test User
-- =====================================================
-- Email: test@preview.local
-- Password: "PreviewPassword123!" (hashed using Better Auth)
-- This user can be used to test the preview environment

INSERT INTO "public"."user" (
    "id",
    "name",
    "email",
    "emailVerified",
    "image",
    "createdAt",
    "updatedAt",
    "username",
    "role",
    "banned",
    "onboardingComplete",
    "twoFactorEnabled"
) VALUES (
    'preview_user_001',
    'Preview Test User',
    'test@preview.local',
    true,
    NULL,
    NOW(),
    NOW(),
    'preview_tester',
    'user',
    false,
    true,
    false
) ON CONFLICT ("id") DO NOTHING;

-- Create account entry for credential-based login
-- Password: "PreviewPassword123!" - hashed using Better Auth's password.hash()
INSERT INTO "public"."account" (
    "id",
    "accountId",
    "providerId",
    "userId",
    "accessToken",
    "refreshToken",
    "idToken",
    "expiresAt",
    "password",
    "createdAt",
    "updatedAt"
) VALUES (
    'preview_account_001',
    'preview_user_001',
    'credential',
    'preview_user_001',
    NULL,
    NULL,
    NULL,
    NULL,
    'c23abb2783a2ac51ed7d399d359a4a4f:24282aad657c2c5e2b295a2205842333ef8a9262fcea3248bba145307d7217d1542ec04bb0cf3527411c58e0e2e1617fe592e0c262f2a3320e6d3bb88d9a804a',
    NOW(),
    NOW()
) ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- Test Organization (Tenant)
-- =====================================================
-- Organization: "Preview Test Org"
-- Slug: preview-test-org

INSERT INTO "public"."organization" (
    "id",
    "name",
    "slug",
    "logo",
    "createdAt",
    "metadata",
    "paymentsCustomerId"
) VALUES (
    'preview_org_001',
    'Preview Test Organization',
    'preview-test-org',
    NULL,
    NOW(),
    '{"environment": "preview", "seed_version": "1.0"}',
    NULL
) ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- Organization Membership
-- =====================================================
-- Make the test user an owner of the test organization

INSERT INTO "public"."member" (
    "id",
    "organizationId",
    "userId",
    "role",
    "createdAt"
) VALUES (
    'preview_member_001',
    'preview_org_001',
    'preview_user_001',
    'owner',
    NOW()
) ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- =====================================================
-- Seed Validation Marker
-- =====================================================
-- This entry is used by the validation script to confirm seed ran successfully

INSERT INTO "public"."verification" (
    "id",
    "identifier",
    "value",
    "expiresAt",
    "createdAt",
    "updatedAt"
) VALUES (
    'preview_seed_marker',
    '__preview_seed_validation__',
    'seeded_at_' || to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    NOW() + INTERVAL '100 years',
    NOW(),
    NOW()
) ON CONFLICT ("id") DO UPDATE SET
    "value" = 'seeded_at_' || to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    "updatedAt" = NOW();

-- =====================================================
-- Output confirmation
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Preview branch seed completed successfully';
    RAISE NOTICE 'Test User: test@preview.local';
    RAISE NOTICE 'Test Org: preview-test-org';
END $$;
