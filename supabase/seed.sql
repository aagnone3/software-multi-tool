-- Supabase Preview Branch Seed Data
-- This seed file runs automatically on preview branch creation
-- Creates a test tenant (organization) and user for preview environment testing
--
-- Note: Uses better-auth for authentication, not Supabase Auth
-- See .claude/skills/better-auth/ for auth implementation details

-- =====================================================
-- Storage Buckets
-- =====================================================
-- Create storage buckets needed for the application
-- These are not automatically created on preview branches

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false,
    52428800, -- 50MB
    NULL -- Allow all MIME types
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Test User
-- =====================================================
-- Email: test@preview.local
-- Password: "TestPassword123" (hashed using Better Auth)
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
-- Password: "PreviewPassword123!" - hashed using Better Auth's hashPassword()
-- IMPORTANT: This hash MUST be generated using better-auth/crypto's hashPassword()
-- Other scrypt implementations will NOT work due to different parameters.
-- To regenerate: run `pnpm --filter @repo/auth test -- --grep "Password hashing"`
-- and copy the hash from the test output.
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
    '82c764f05562c8bf07546bda4ef17e48:409a2556ed4349d0701eda52ee62716627fd25cd0059f598b3adb9f987d4e958f68c9ef4df4889ec33cd054fae68c89fcbcce8aba12f17a5edcff07375f09fad',
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
-- Completed Meeting Summarizer job (recent)
-- Note: Seed data should only use terminal states (COMPLETED/FAILED)
-- because seeded jobs are not submitted to pg-boss for processing.
-- PENDING/PROCESSING jobs would appear stuck in the UI.
(
    'preview_job_016',
    'meeting-summarizer',
    'COMPLETED',
    0,
    '{"meetingDuration": 60, "attendees": 5}',
    '{"summary": "Team sync meeting covering Q1 goals", "actionItems": 3, "decisions": 2}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '9 minutes',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '9 minutes'
),
-- Completed Feedback Analyzer job (recent)
(
    'preview_job_017',
    'feedback-analyzer',
    'COMPLETED',
    0,
    '{"reviewCount": 12}',
    '{"sentimentBreakdown": {"positive": 8, "neutral": 3, "negative": 1}, "topThemes": ["quality", "service"]}',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '1 minute',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '1 minute'
)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- News Analyzer Jobs - Comprehensive Seed Data
-- =====================================================
-- Creates diverse news analyzer jobs to support UI/UX design iteration
-- covering various political leans, sentiment, sensationalism levels

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
-- 1. Left-leaning, high sensationalism climate article
(
    'news_analyzer_001',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/climate-crisis-emergency-action-needed"}',
    '{
        "summary": [
            "World leaders face mounting pressure to declare climate emergency as global temperatures reach record highs",
            "Scientists warn of irreversible tipping points within the next decade without immediate action",
            "Youth activists organize worldwide protests demanding fossil fuel phase-out",
            "Major corporations face criticism for greenwashing while continuing harmful practices",
            "Island nations call for urgent international support as sea levels threaten existence"
        ],
        "bias": {
            "politicalLean": "Left",
            "sensationalism": 8,
            "factualRating": "Medium"
        },
        "entities": {
            "people": ["Greta Thunberg", "António Guterres", "John Kerry"],
            "organizations": ["United Nations", "Greenpeace", "World Wildlife Fund", "IPCC"],
            "places": ["Paris", "New York", "Maldives", "Bangladesh"]
        },
        "sentiment": "Negative",
        "sourceCredibility": "Medium",
        "relatedContext": [
            "The Paris Agreement was signed in 2015 with goals to limit warming to 1.5°C",
            "COP28 in Dubai saw record attendance but mixed outcomes on fossil fuel commitments"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours' + INTERVAL '25 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '10 hours' + INTERVAL '25 seconds'
),
-- 2. Right-leaning, low sensationalism economics article
(
    'news_analyzer_002',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/federal-reserve-interest-rates-analysis"}',
    '{
        "summary": [
            "Federal Reserve maintains current interest rate policy amid mixed economic signals",
            "Inflation data shows gradual decline toward 2% target over 18-month period",
            "Labor market remains resilient with unemployment at 3.7%",
            "Treasury yields stabilize following recent market volatility",
            "Business investment shows cautious optimism in Q4 projections"
        ],
        "bias": {
            "politicalLean": "Center-Right",
            "sensationalism": 2,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Jerome Powell", "Janet Yellen", "Larry Summers"],
            "organizations": ["Federal Reserve", "Treasury Department", "Wall Street Journal", "Goldman Sachs"],
            "places": ["Washington D.C.", "New York", "Silicon Valley"]
        },
        "sentiment": "Neutral",
        "sourceCredibility": "High",
        "relatedContext": [
            "The Federal Reserve has raised rates 11 times since March 2022",
            "Core PCE inflation peaked at 5.6% in early 2022"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '6 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '14 hours' + INTERVAL '22 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '6 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '6 days' + INTERVAL '14 hours' + INTERVAL '22 seconds'
),
-- 3. Center, moderate sensationalism tech article
(
    'news_analyzer_003',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/ai-regulation-debate-congress"}',
    '{
        "summary": [
            "Bipartisan group of senators introduces comprehensive AI regulation framework",
            "Tech industry leaders testify before Congress on benefits and risks of artificial intelligence",
            "Proposed legislation would require transparency in AI training data and algorithmic decisions",
            "Consumer advocacy groups call for stronger protections against AI-driven discrimination",
            "International coordination efforts aim to establish global AI governance standards"
        ],
        "bias": {
            "politicalLean": "Center",
            "sensationalism": 5,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Sam Altman", "Sundar Pichai", "Chuck Schumer", "Marsha Blackburn"],
            "organizations": ["OpenAI", "Google", "Microsoft", "US Senate", "FTC"],
            "places": ["Washington D.C.", "San Francisco", "Brussels"]
        },
        "sentiment": "Neutral",
        "sourceCredibility": "High",
        "relatedContext": [
            "The EU AI Act was approved in December 2023 as the first comprehensive AI law",
            "Executive Order 14110 established AI safety requirements for federal use"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '5 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '9 hours' + INTERVAL '28 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '5 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '9 hours' + INTERVAL '28 seconds'
),
-- 4. Center-Left, positive sentiment healthcare article
(
    'news_analyzer_004',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/breakthrough-cancer-treatment-fda-approval"}',
    '{
        "summary": [
            "FDA grants accelerated approval for revolutionary CAR-T cell therapy targeting solid tumors",
            "Clinical trials show 67% response rate in patients with previously untreatable cancers",
            "Treatment represents first major advance in solid tumor immunotherapy in a decade",
            "Patient advocacy groups celebrate expanded access program for eligible participants",
            "Researchers credit decades of public-private partnership in cancer research"
        ],
        "bias": {
            "politicalLean": "Center-Left",
            "sensationalism": 4,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Dr. Carl June", "Dr. Francis Collins", "Robert Califf"],
            "organizations": ["FDA", "National Cancer Institute", "Novartis", "Memorial Sloan Kettering"],
            "places": ["Philadelphia", "Bethesda", "Boston"]
        },
        "sentiment": "Positive",
        "sourceCredibility": "High",
        "relatedContext": [
            "CAR-T therapy was first approved for blood cancers in 2017",
            "NIH funding for cancer research totaled $7.3 billion in 2023"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '4 days' + INTERVAL '11 hours',
    NOW() - INTERVAL '4 days' + INTERVAL '11 hours' + INTERVAL '31 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '4 days' + INTERVAL '11 hours',
    NOW() - INTERVAL '4 days' + INTERVAL '11 hours' + INTERVAL '31 seconds'
),
-- 5. Right, negative sentiment immigration policy article
(
    'news_analyzer_005',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/border-policy-crisis-analysis"}',
    '{
        "summary": [
            "Border communities report strain on local resources amid record migrant arrivals",
            "State governors deploy National Guard units to supplement federal border agents",
            "Congressional Republicans demand immediate policy changes before budget negotiations",
            "Humanitarian organizations struggle to meet demand for shelter and services",
            "Economic analysis shows mixed impact of immigration on local labor markets"
        ],
        "bias": {
            "politicalLean": "Right",
            "sensationalism": 7,
            "factualRating": "Medium"
        },
        "entities": {
            "people": ["Greg Abbott", "Alejandro Mayorkas", "Ron DeSantis"],
            "organizations": ["Department of Homeland Security", "Border Patrol", "Texas National Guard"],
            "places": ["El Paso", "Eagle Pass", "New York City", "Chicago"]
        },
        "sentiment": "Negative",
        "sourceCredibility": "Medium",
        "relatedContext": [
            "CBP encountered over 2 million migrants at the southern border in fiscal year 2023",
            "Title 42 public health order ended in May 2023"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '3 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '16 hours' + INTERVAL '27 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '3 days' + INTERVAL '16 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '16 hours' + INTERVAL '27 seconds'
),
-- 6. Center-Left, low sensationalism education article
(
    'news_analyzer_006',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleText": "A new study released by the Department of Education shows promising results from expanded early childhood education programs. Students who participated in universal pre-K programs demonstrated measurably higher reading and math scores through third grade compared to peers without access. The longitudinal study tracked 50,000 students across 12 states over five years. Researchers noted that benefits were most pronounced among students from lower-income households, suggesting programs may help address educational inequality. The Biden administration cited the findings in support of proposed federal pre-K expansion, while some fiscal conservatives questioned the cost-effectiveness compared to targeted interventions."}',
    '{
        "summary": [
            "New longitudinal study shows universal pre-K programs improve student outcomes through third grade",
            "Research tracked 50,000 students across 12 states over five years",
            "Benefits most pronounced for students from lower-income households",
            "Administration uses findings to support federal pre-K expansion proposal",
            "Some question cost-effectiveness compared to targeted programs"
        ],
        "bias": {
            "politicalLean": "Center-Left",
            "sensationalism": 2,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Miguel Cardona"],
            "organizations": ["Department of Education", "National Bureau of Economic Research"],
            "places": ["Washington D.C."]
        },
        "sentiment": "Positive",
        "sourceCredibility": "High",
        "relatedContext": [
            "The Head Start program has served over 37 million children since 1965",
            "Current federal spending on early childhood education is approximately $12 billion annually"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours' + INTERVAL '35 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours' + INTERVAL '35 seconds'
),
-- 7. Extreme Left, very high sensationalism article (for testing edge cases)
(
    'news_analyzer_007',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/corporate-greed-destroys-democracy"}',
    '{
        "summary": [
            "Investigation reveals massive corporate lobbying campaign to defeat worker protection legislation",
            "Leaked documents show coordinated effort to suppress union organizing across multiple industries",
            "Whistleblowers face retaliation after exposing wage theft schemes affecting millions",
            "Progressive lawmakers call for immediate hearings and criminal referrals",
            "Grassroots movements organize nationwide strikes in response to findings"
        ],
        "bias": {
            "politicalLean": "Left",
            "sensationalism": 9,
            "factualRating": "Low"
        },
        "entities": {
            "people": ["Bernie Sanders", "Elizabeth Warren", "Alexandria Ocasio-Cortez"],
            "organizations": ["AFL-CIO", "Chamber of Commerce", "Amazon", "Starbucks"],
            "places": ["Seattle", "Alabama", "New York"]
        },
        "sentiment": "Negative",
        "sourceCredibility": "Low",
        "relatedContext": [
            "Union membership in the US reached a record low of 10% in 2023",
            "NLRB filed more unfair labor practice complaints in 2023 than any year since 2016"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '1 day' + INTERVAL '8 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '8 hours' + INTERVAL '24 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '1 day' + INTERVAL '8 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '8 hours' + INTERVAL '24 seconds'
),
-- 8. Extreme Right, very high sensationalism (for testing edge cases)
(
    'news_analyzer_008',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/government-overreach-freedom-under-attack"}',
    '{
        "summary": [
            "Federal agencies accused of weaponization against political opponents",
            "Second Amendment advocates warn of unprecedented gun control push",
            "Parents mobilize against school curriculum they say promotes radical ideology",
            "State legislators propose bills to limit federal authority within borders",
            "Religious liberty groups claim systematic discrimination in recent court rulings"
        ],
        "bias": {
            "politicalLean": "Right",
            "sensationalism": 10,
            "factualRating": "Low"
        },
        "entities": {
            "people": ["Donald Trump", "Ron DeSantis", "Jim Jordan"],
            "organizations": ["NRA", "Heritage Foundation", "Moms for Liberty", "FBI"],
            "places": ["Florida", "Texas", "Washington D.C."]
        },
        "sentiment": "Negative",
        "sourceCredibility": "Low",
        "relatedContext": [
            "Congressional oversight hearings have increased dramatically since 2023",
            "Multiple states have passed laws limiting federal enforcement authority"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '1 day' + INTERVAL '14 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '29 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '1 day' + INTERVAL '14 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '29 seconds'
),
-- 9. Perfect center, balanced international news
(
    'news_analyzer_009',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/g20-summit-economic-cooperation"}',
    '{
        "summary": [
            "G20 leaders agree on framework for international digital tax coordination",
            "Summit addresses global supply chain resilience following pandemic disruptions",
            "Climate finance commitments reaffirmed with new accountability mechanisms",
            "Trade tensions between major economies remain unresolved despite negotiations",
            "Joint statement emphasizes multilateral cooperation on emerging challenges"
        ],
        "bias": {
            "politicalLean": "Center",
            "sensationalism": 3,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Joe Biden", "Xi Jinping", "Narendra Modi", "Olaf Scholz", "Emmanuel Macron"],
            "organizations": ["G20", "World Bank", "IMF", "WTO"],
            "places": ["New Delhi", "Beijing", "Brussels", "Washington"]
        },
        "sentiment": "Neutral",
        "sourceCredibility": "High",
        "relatedContext": [
            "The G20 represents approximately 85% of global GDP",
            "Previous summit in Bali produced 52 specific commitments"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours' + INTERVAL '33 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours' + INTERVAL '33 seconds'
),
-- 10. Failed analysis (for testing error states)
(
    'news_analyzer_010',
    'news-analyzer',
    'FAILED',
    0,
    '{"articleUrl": "https://invalid-domain-that-does-not-exist.fake/article"}',
    NULL,
    'Failed to fetch article: DNS resolution failed for invalid-domain-that-does-not-exist.fake',
    'preview_user_001',
    NULL,
    3,
    3,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours' - INTERVAL '45 minutes',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours' - INTERVAL '45 minutes'
),
-- 11. Recent completed analysis (for "just now" display)
(
    'news_analyzer_011',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleUrl": "https://example.com/local-sports-championship"}',
    '{
        "summary": [
            "Local high school team wins state championship in thrilling overtime victory",
            "Star quarterback throws game-winning touchdown with 12 seconds remaining",
            "Community celebrates first state title in 25 years",
            "Coach credits team dedication and support from fans throughout season",
            "Several players receive scholarship offers from Division I programs"
        ],
        "bias": {
            "politicalLean": "Center",
            "sensationalism": 6,
            "factualRating": "High"
        },
        "entities": {
            "people": ["Marcus Johnson", "Coach Sarah Williams"],
            "organizations": ["Lincoln High School", "State Athletic Association"],
            "places": ["Springfield", "Capital Stadium"]
        },
        "sentiment": "Positive",
        "sourceCredibility": "Medium",
        "relatedContext": [
            "The team finished the season with a 14-0 record",
            "Average attendance for home games was 8,500 fans"
        ]
    }',
    NULL,
    'preview_user_001',
    NULL,
    1,
    3,
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes' - INTERVAL '30 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '4 minutes' - INTERVAL '30 seconds'
),
-- 12. Session-based (anonymous user) analysis
(
    'news_analyzer_012',
    'news-analyzer',
    'COMPLETED',
    0,
    '{"articleText": "The city council approved a new zoning ordinance last night that will allow mixed-use development in previously residential-only areas. The 5-2 vote came after months of public hearings and debate. Supporters argue the change will increase housing supply and reduce commute times. Opponents worry about increased traffic and changes to neighborhood character. The ordinance takes effect in 90 days."}',
    '{
        "summary": [
            "City council approves mixed-use zoning ordinance in 5-2 vote",
            "Change allows commercial development in previously residential areas",
            "Supporters cite housing supply and reduced commutes as benefits",
            "Opponents raise concerns about traffic and neighborhood character",
            "New ordinance takes effect in 90 days"
        ],
        "bias": {
            "politicalLean": "Center",
            "sensationalism": 1,
            "factualRating": "High"
        },
        "entities": {
            "people": [],
            "organizations": ["City Council"],
            "places": []
        },
        "sentiment": "Neutral",
        "sourceCredibility": "High",
        "relatedContext": []
    }',
    NULL,
    NULL,
    'session-preview-anon-001',
    1,
    3,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '18 seconds',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '18 seconds'
)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- Output confirmation
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Preview branch seed completed successfully';
    RAISE NOTICE 'Storage Buckets: avatars (public, 5MB), files (private, 50MB)';
    RAISE NOTICE 'Test User: test@preview.local';
    RAISE NOTICE 'Test Org: preview-test-org';
    RAISE NOTICE 'Credit Balance: 500 included, 247 used, 100 purchased';
    RAISE NOTICE 'Credit Transactions: 17 transactions over 14 days';
    RAISE NOTICE 'Tool Jobs: 8 sample jobs (7 completed, 1 failed) - all terminal states';
    RAISE NOTICE 'News Analyzer: 12 diverse analyses for UI/UX testing';
END $$;
