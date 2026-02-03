# Background Jobs (Inngest)

Background job processing is powered by **Inngest**, a durable execution platform.

## Architecture

```text
┌─────────────────┐    Event    ┌─────────────────┐
│   Application   │ ──────────► │    Inngest      │
│  (send event)   │             │   (queues job)  │
└─────────────────┘             └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │  Serve Endpoint │
                                │ /api/inngest    │
                                └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Inngest Function│
                                │ (runs in steps) │
                                └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │   PostgreSQL    │
                                │  (job status)   │
                                └─────────────────┘
```

## Inngest Module Files

| File | Purpose |
| ---- | ------- |
| `apps/web/inngest/client.ts` | Inngest client with typed event schemas |
| `apps/web/inngest/functions/` | Job function implementations |
| `apps/web/app/api/inngest/route.ts` | Serve endpoint (registers all functions) |

## Job Functions

8 job processors are registered:

| Function | Purpose | Duration |
| -------- | ------- | -------- |
| `news-analyzer` | Analyze news articles with AI | < 2 min |
| `contract-analyzer` | Analyze legal contracts with AI | < 5 min |
| `feedback-analyzer` | Analyze customer feedback | < 2 min |
| `invoice-processor` | Extract data from invoices | < 2 min |
| `expense-categorizer` | Categorize business expenses | < 2 min |
| `meeting-summarizer` | Summarize meeting transcripts | < 5 min |
| `speaker-separation` | Transcribe audio with speaker IDs | 5-60+ min |
| `gdpr-exporter` | Export user data for GDPR | < 10 min |

## Function Pattern

All functions use the same 3-step pattern:

1. **validate-job**: Verify the job exists in the database
2. **process-\<job\>**: Run the processor logic (re-fetch job data)
3. **update-job-status**: Mark job completed or failed

```typescript
// Example: apps/web/inngest/functions/news-analyzer.ts
export const newsAnalyzer = inngest.createFunction(
  { id: "news-analyzer", retries: 3 },
  { event: "jobs/news-analyzer.requested" },
  async ({ event, step }) => {
    // Step 1: Validate
    await step.run("validate-job", async () => { ... });
    // Step 2: Process
    const result = await step.run("process-analysis", async () => { ... });
    // Step 3: Update status
    await step.run("update-job-status", async () => { ... });
  }
);
```

## Long-Running Jobs

For jobs exceeding serverless timeout (speaker-separation):

- Use Inngest steps to break work into checkpoints
- Each step can run up to 2 hours
- Steps are retried independently on failure
- Example: AssemblyAI transcription uses submit → poll pattern

## Local Development

```bash
npx inngest-cli@latest dev
```

Starts dashboard at http://localhost:8288 showing:

- Registered functions
- Event history
- Function run traces
