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
-- Credit Balance for Preview Organization
-- =====================================================
-- Creates a credit balance record for the current billing period
-- with realistic usage data

INSERT INTO "public"."credit_balance" (
    "id",
    "organizationId",
    "periodStart",
    "periodEnd",
    "included",
    "used",
    "overage",
    "purchasedCredits",
    "createdAt",
    "updatedAt"
) VALUES (
    'preview_credit_balance_001',
    'preview_org_001',
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
    500, -- Pro plan included credits
    247, -- Total used credits (sum of transactions below)
    0,
    100, -- Purchased additional credits
    NOW(),
    NOW()
) ON CONFLICT ("organizationId") DO UPDATE SET
    "periodStart" = date_trunc('month', NOW()),
    "periodEnd" = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
    "included" = 500,
    "used" = 247,
    "overage" = 0,
    "purchasedCredits" = 100,
    "updatedAt" = NOW();

-- =====================================================
-- Credit Transactions - Usage History
-- =====================================================
-- Creates realistic credit transactions spread across the last 14 days
-- Mix of different tools, transaction types, and amounts

-- Day 1: Background Remover usage (14 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_001',
    'preview_credit_balance_001',
    -3,
    'USAGE',
    'bg-remover',
    'preview_job_001',
    'Background removal - 3 images',
    NOW() - INTERVAL '14 days' + INTERVAL '10 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 2: Invoice Processor usage (13 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_002',
    'preview_credit_balance_001',
    -9,
    'USAGE',
    'invoice-processor',
    'preview_job_002',
    'Invoice processing - 3 documents',
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 3: News Analyzer usage (12 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_003',
    'preview_credit_balance_001',
    -5,
    'USAGE',
    'news-analyzer',
    'preview_job_003',
    'News analysis - 5 articles',
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 4: Contract Analyzer usage (11 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_004',
    'preview_credit_balance_001',
    -25,
    'USAGE',
    'contract-analyzer',
    'preview_job_004',
    'Contract analysis - 5 pages',
    NOW() - INTERVAL '11 days' + INTERVAL '11 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 5: Speaker Diarization usage (10 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_005',
    'preview_credit_balance_001',
    -16,
    'USAGE',
    'diarization',
    'preview_job_005',
    'Speaker diarization - 8 minutes audio',
    NOW() - INTERVAL '10 days' + INTERVAL '15 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 6: Credit Pack Purchase (9 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_006',
    'preview_credit_balance_001',
    100,
    'PURCHASE',
    NULL,
    NULL,
    'Credit Pack: Bundle (200 credits)',
    NOW() - INTERVAL '9 days' + INTERVAL '12 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 7: Feedback Analyzer usage (8 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_007',
    'preview_credit_balance_001',
    -8,
    'USAGE',
    'feedback-analyzer',
    'preview_job_006',
    'Feedback analysis - 8 reviews',
    NOW() - INTERVAL '8 days' + INTERVAL '10 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 8: Meeting Summarizer usage (7 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_008',
    'preview_credit_balance_001',
    -6,
    'USAGE',
    'meeting-summarizer',
    'preview_job_007',
    'Meeting summaries - 3 meetings',
    NOW() - INTERVAL '7 days' + INTERVAL '16 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 9: Expense Categorizer usage (6 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_009',
    'preview_credit_balance_001',
    -15,
    'USAGE',
    'expense-categorizer',
    'preview_job_008',
    'Expense categorization - 15 expenses',
    NOW() - INTERVAL '6 days' + INTERVAL '9 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 10: Background Remover usage (5 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_010',
    'preview_credit_balance_001',
    -7,
    'USAGE',
    'bg-remover',
    'preview_job_009',
    'Background removal - 7 images',
    NOW() - INTERVAL '5 days' + INTERVAL '13 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 11: Contract Analyzer usage (4 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_011',
    'preview_credit_balance_001',
    -50,
    'USAGE',
    'contract-analyzer',
    'preview_job_010',
    'Contract analysis - 10 pages',
    NOW() - INTERVAL '4 days' + INTERVAL '11 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 12: Invoice Processor usage (3 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_012',
    'preview_credit_balance_001',
    -12,
    'USAGE',
    'invoice-processor',
    'preview_job_011',
    'Invoice processing - 4 documents',
    NOW() - INTERVAL '3 days' + INTERVAL '10 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 13: News Analyzer usage (2 days ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_013',
    'preview_credit_balance_001',
    -10,
    'USAGE',
    'news-analyzer',
    'preview_job_012',
    'News analysis - 10 articles',
    NOW() - INTERVAL '2 days' + INTERVAL '14 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 14: Speaker Diarization usage (1 day ago)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_014',
    'preview_credit_balance_001',
    -20,
    'USAGE',
    'diarization',
    'preview_job_013',
    'Speaker diarization - 10 minutes audio',
    NOW() - INTERVAL '1 day' + INTERVAL '11 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Day 15: Meeting Summarizer and Refund (today)
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_015',
    'preview_credit_balance_001',
    -4,
    'USAGE',
    'meeting-summarizer',
    'preview_job_014',
    'Meeting summaries - 2 meetings',
    NOW() - INTERVAL '6 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Adjustment/Refund for failed job
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_016',
    'preview_credit_balance_001',
    3,
    'REFUND',
    'invoice-processor',
    'preview_job_015',
    'Refund for failed job',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT ("id") DO NOTHING;

-- Grant for monthly billing period
INSERT INTO "public"."credit_transaction" (
    "id",
    "balanceId",
    "amount",
    "type",
    "toolSlug",
    "jobId",
    "description",
    "createdAt"
) VALUES (
    'preview_txn_017',
    'preview_credit_balance_001',
    500,
    'GRANT',
    NULL,
    NULL,
    'Monthly included credits (Pro plan)',
    date_trunc('month', NOW()) + INTERVAL '1 minute'
) ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- Tool Jobs - Job History
-- =====================================================
-- Creates sample tool job records to show job history

INSERT INTO "public"."tool_job" (
    "id",
    "toolSlug",
    "status",
    "priority",
    "input",
    "output",
    "error",
    "userId",
    "sessionId",
    "attempts",
    "maxAttempts",
    "startedAt",
    "completedAt",
    "expiresAt",
    "createdAt",
    "updatedAt"
) VALUES
-- Completed Background Remover job
(
    'preview_job_001',
    'bg-remover',
    'COMPLETED',
    0,
    '{"imageCount": 3}',
    '{"processedImages": 3, "success": true}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '14 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '14 days' + INTERVAL '10 hours' + INTERVAL '30 seconds',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '14 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '14 days' + INTERVAL '10 hours' + INTERVAL '30 seconds'
),
-- Completed Invoice Processor job
(
    'preview_job_002',
    'invoice-processor',
    'COMPLETED',
    0,
    '{"documentCount": 3}',
    '{"processedDocuments": 3, "extractedData": true}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours' + INTERVAL '2 minutes',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours' + INTERVAL '2 minutes'
),
-- Completed News Analyzer job
(
    'preview_job_003',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleCount": 5, "url": "https://example.com/news"}',
    '{"analyzedArticles": 5, "sentimentScores": [0.7, 0.3, 0.5, 0.8, 0.4]}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours' + INTERVAL '45 seconds',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '12 days' + INTERVAL '9 hours' + INTERVAL '45 seconds'
),
-- Completed Contract Analyzer job
(
    'preview_job_004',
    'contract-analyzer',
    'COMPLETED',
    0,
    '{"pageCount": 5, "documentType": "NDA"}',
    '{"analyzedPages": 5, "keyTerms": ["confidentiality", "non-disclosure", "term"]}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '11 days' + INTERVAL '11 hours',
    NOW() - INTERVAL '11 days' + INTERVAL '11 hours' + INTERVAL '3 minutes',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '11 days' + INTERVAL '11 hours',
    NOW() - INTERVAL '11 days' + INTERVAL '11 hours' + INTERVAL '3 minutes'
),
-- Completed Speaker Diarization job
(
    'preview_job_005',
    'diarization',
    'COMPLETED',
    0,
    '{"audioDuration": 480, "format": "mp3"}',
    '{"speakers": 3, "segments": 24, "transcription": true}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '10 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '10 days' + INTERVAL '15 hours' + INTERVAL '5 minutes',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '10 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '10 days' + INTERVAL '15 hours' + INTERVAL '5 minutes'
),
-- Failed Invoice Processor job (will be refunded)
(
    'preview_job_015',
    'invoice-processor',
    'FAILED',
    0,
    '{"documentCount": 1}',
    NULL,
    'Document format not supported',
    'preview_user_001',
    NULL,
    3,
    3,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours' - INTERVAL '30 minutes',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours' - INTERVAL '30 minutes'
),
-- Pending job
(
    'preview_job_016',
    'meeting-summarizer',
    'PENDING',
    0,
    '{"meetingDuration": 60, "attendees": 5}',
    NULL,
    NULL,
    'preview_user_001',
    NULL,
    0,
    3,
    NULL,
    NULL,
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes'
),
-- Processing job
(
    'preview_job_017',
    'feedback-analyzer',
    'PROCESSING',
    0,
    '{"reviewCount": 12}',
    NULL,
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '1 minute',
    NULL,
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '1 minute'
)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- Output confirmation
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Preview branch seed completed successfully';
    RAISE NOTICE 'Test User: test@preview.local';
    RAISE NOTICE 'Test Org: preview-test-org';
    RAISE NOTICE 'Credit Balance: 500 included, 247 used, 100 purchased';
    RAISE NOTICE 'Credit Transactions: 17 transactions over 14 days';
    RAISE NOTICE 'Tool Jobs: 8 sample jobs (5 completed, 1 failed, 1 pending, 1 processing)';
END $$;
