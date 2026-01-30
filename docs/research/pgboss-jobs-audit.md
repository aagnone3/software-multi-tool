# pg-boss Jobs Audit

This document catalogs all background jobs currently running on the api-server via pg-boss.

## Overview

The api-server uses pg-boss as a PostgreSQL-based job queue. Jobs are created via the `createJob` API endpoint in the web app and processed by workers in the api-server.

**Key files:**

- `apps/api-server/src/workers/index.ts` - Worker registration and job processing
- `apps/api-server/src/lib/pg-boss.ts` - pg-boss initialization and configuration
- `packages/api/modules/jobs/lib/job-config.ts` - Centralized timeout and retry configuration
- `packages/api/modules/jobs/lib/queue.ts` - Queue submission from web app

## Global Configuration

| Setting | Value | Notes |
| ------- | ----- | ----- |
| Job timeout | 10 minutes (600s) | `JOB_TIMEOUT_MS` / `JOB_TIMEOUT_SECONDS` |
| Retry limit | 3 | Exponential backoff: 60s, 120s, 240s |
| Stuck job cleanup | 30 minutes | Cron-based fallback |
| Batch size | 5 jobs | Per poll cycle |
| Polling interval | 2 seconds | Worker poll frequency |

## Job Processors

### 1. news-analyzer

Analyzes news articles for bias, sentiment, and key entities using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `news-analyzer` |
| Processor | `packages/api/modules/news-analyzer/lib/processor.ts` |
| Trigger | User submits article URL or text via UI |
| AI model | Claude Haiku (`claude-3-5-haiku-20241022`) |
| Max tokens | 2,048 |
| Expected duration | 5-30 seconds |
| Serverless compatible | Yes |

**Processing steps:**

1. Extract content from URL (using JSDOM/Readability) or parse pasted text
2. Send to Claude for structured analysis (bias, sentiment, entities, summary)
3. Create `NewsAnalysis` record in database
4. Return JSON output

### 2. speaker-separation

Separates speakers in audio files using AssemblyAI transcription service.

| Attribute | Value |
| --------- | ----- |
| Queue name | `speaker-separation` |
| Processor | `packages/api/modules/speaker-separation/lib/processor.ts` |
| Trigger | User uploads audio file via UI |
| External API | AssemblyAI |
| Expected duration | 5-60+ minutes (depends on audio length) |
| Serverless compatible | **No** - exceeds timeout limits |

**Processing steps:**

1. Download audio from Supabase storage
2. Upload audio to AssemblyAI
3. Wait for transcription with speaker labels (long-running, synchronous wait)
4. Calculate speaker statistics
5. Format transcript with speaker labels
6. Return JSON output

**Migration note:** This job is the most critical to migrate. AssemblyAI transcription can take 30+ minutes for long audio files. The current implementation uses a synchronous wait (`await client.transcripts.transcribe()`), which will timeout in serverless environments (Vercel max: 800s Pro, 300s Hobby).

### 3. invoice-processor

Extracts structured data from invoice documents using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `invoice-processor` |
| Processor | `packages/api/modules/invoice-processor/lib/processor.ts` |
| Trigger | User uploads invoice file via UI |
| AI model | Claude Haiku (`claude-3-5-haiku-20241022`) |
| Max tokens | 4,096 |
| Expected duration | 10-60 seconds |
| Serverless compatible | Yes (with consideration for OCR) |

**Processing steps:**

1. Fetch file from Supabase storage
2. Extract text (PDF parsing, OCR for images)
3. Send to Claude for structured extraction (vendor, items, totals, etc.)
4. Return JSON output

**Note:** OCR processing for image-based invoices may take longer but should stay within timeout limits.

### 4. contract-analyzer

Analyzes legal contracts for risks, terms, and obligations using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `contract-analyzer` |
| Processor | `packages/api/modules/contract-analyzer/lib/processor.ts` |
| Trigger | User uploads contract file or pastes text via UI |
| AI model | Claude Sonnet (`claude-3-5-sonnet-20241022`) |
| Max tokens | 8,192 |
| Expected duration | 15-90 seconds |
| Serverless compatible | Yes |

**Processing steps:**

1. Extract text from uploaded file or use pasted text
2. Send to Claude for legal analysis (risks, terms, parties, etc.)
3. Return JSON output

### 5. feedback-analyzer

Analyzes customer feedback for sentiment, themes, and actionable insights using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `feedback-analyzer` |
| Processor | `packages/api/modules/feedback-analyzer/lib/processor.ts` |
| Trigger | User submits feedback text via UI |
| AI model | Claude Sonnet (`claude-3-5-sonnet-20241022`) |
| Max tokens | 8,192 |
| Expected duration | 10-60 seconds |
| Serverless compatible | Yes |

**Processing steps:**

1. Parse feedback text (single or batch)
2. Send to Claude for sentiment and theme analysis
3. Return JSON output (sentiment, topics, NPS indicator, etc.)

### 6. expense-categorizer

Categorizes business expenses for tax purposes using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `expense-categorizer` |
| Processor | `packages/api/modules/expense-categorizer/lib/processor.ts` |
| Trigger | User submits expense list via UI |
| AI model | Claude Haiku (`claude-3-5-haiku-20241022`) |
| Max tokens | 8,192 |
| Expected duration | 5-30 seconds |
| Serverless compatible | Yes |

**Processing steps:**

1. Format expense list with context (business type, tax year)
2. Send to Claude for categorization (IRS categories, deductibility)
3. Return JSON output (categorized expenses, tax insights)

### 7. meeting-summarizer

Summarizes meeting transcripts and extracts action items using Claude AI.

| Attribute | Value |
| --------- | ----- |
| Queue name | `meeting-summarizer` |
| Processor | `packages/api/modules/meeting-summarizer/lib/processor.ts` |
| Trigger | User uploads transcript file or pastes notes via UI |
| AI model | Claude Sonnet (`claude-3-5-sonnet-20241022`) |
| Max tokens | 8,192 |
| Expected duration | 15-90 seconds |
| Serverless compatible | Yes |

**Processing steps:**

1. Parse transcript file (VTT, SRT, TXT, JSON) or use pasted text
2. Extract speaker names from transcript format
3. Send to Claude for summarization (topics, action items, decisions)
4. Return JSON output with multiple export formats (Markdown, Slack, Jira)

### 8. gdpr-exporter

Exports all user data for GDPR compliance (data portability).

| Attribute | Value |
| --------- | ----- |
| Queue name | `gdpr-exporter` |
| Processor | `packages/api/modules/gdpr-exporter/lib/processor.ts` |
| Trigger | User requests data export from account settings |
| External services | Supabase Storage, email service |
| Expected duration | 10-120 seconds |
| Serverless compatible | Yes (but edge cases possible) |

**Processing steps:**

1. Collect all user data from database (profile, accounts, sessions, etc.)
2. Transform to portable JSON format
3. Upload to storage with signed URL (24-hour expiry)
4. Send email notification to user
5. Create audit log entry
6. Return JSON output (download URL, expiry)

**Note:** For users with very large datasets (thousands of AI chats, tool jobs), this could approach timeout limits but should generally complete within bounds.

## Serverless Timeout Analysis

| Job | Expected Duration | Vercel Hobby (300s) | Vercel Pro (800s) | Recommendation |
| --- | ----------------- | ------------------- | ----------------- | -------------- |
| news-analyzer | 5-30s | Safe | Safe | Direct migration |
| speaker-separation | 5-60+ min | **Fails** | **Fails** | Use Inngest steps |
| invoice-processor | 10-60s | Safe | Safe | Direct migration |
| contract-analyzer | 15-90s | Safe | Safe | Direct migration |
| feedback-analyzer | 10-60s | Safe | Safe | Direct migration |
| expense-categorizer | 5-30s | Safe | Safe | Direct migration |
| meeting-summarizer | 15-90s | Safe | Safe | Direct migration |
| gdpr-exporter | 10-120s | Safe | Safe | Direct migration |

## Migration Recommendations

### Jobs Safe for Direct Inngest Migration

These jobs can be migrated to simple Inngest functions with minimal changes:

1. **news-analyzer** - Simple AI call, well within limits
2. **invoice-processor** - File processing + AI call
3. **contract-analyzer** - File processing + AI call
4. **feedback-analyzer** - Text processing + AI call
5. **expense-categorizer** - Text processing + AI call
6. **meeting-summarizer** - File processing + AI call
7. **gdpr-exporter** - Database queries + file upload

### Jobs Requiring Inngest Steps

**speaker-separation** requires special handling:

```typescript
// Recommended Inngest implementation
export const speakerSeparation = inngest.createFunction(
  { id: "speaker-separation", retries: 3 },
  { event: "jobs/speaker-separation.requested" },
  async ({ event, step }) => {
    // Step 1: Upload audio to AssemblyAI (< 30s)
    const uploadUrl = await step.run("upload-audio", async () => {
      const buffer = await downloadFromStorage(event.data.audioFileUrl);
      return assemblyai.files.upload(buffer);
    });

    // Step 2: Start transcription (< 5s)
    const transcriptId = await step.run("start-transcription", async () => {
      const result = await assemblyai.transcripts.create({
        audio: uploadUrl,
        speaker_labels: true,
      });
      return result.id;
    });

    // Step 3: Poll for completion (may run many times)
    const transcript = await step.run("poll-transcription", async () => {
      // Poll until complete or error
      // Inngest will retry this step if it times out
      return await pollUntilComplete(transcriptId, { maxWait: 60000 });
    });

    // Step 4: Process results (< 10s)
    const output = await step.run("process-results", async () => {
      return formatSpeakerOutput(transcript);
    });

    return output;
  }
);
```

Alternatively, use AssemblyAI's webhook-based async transcription:

1. Submit transcription with webhook URL
2. Return early from Inngest function
3. Receive webhook when complete
4. Trigger follow-up Inngest event to process results

## Database Schema Impact

The pg-boss schema (`pgboss.*`) was created via Prisma migration (PRA-91). After migration to Inngest:

1. Jobs will no longer be stored in `pgboss.job` table
2. `ToolJob.pgBossJobId` column becomes obsolete
3. Consider adding `inngestRunId` column for traceability

Migration to drop pg-boss tables should be done after confirming all jobs work on Inngest.

## Summary

| Metric | Value |
| ------ | ----- |
| Total job processors | 8 |
| Safe for serverless | 7 |
| Requires special handling | 1 (speaker-separation) |
| Uses Claude AI | 6 |
| Uses external APIs | 1 (AssemblyAI) |
| Involves file storage | 4 |
