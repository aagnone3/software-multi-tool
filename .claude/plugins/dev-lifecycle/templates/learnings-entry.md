# Learnings Entry Template

Use this template when documenting learnings via `/workflows:compound`.

## Standard Learning Document

Save to: `docs/solutions/YYYY-MM-DD-short-description.md`

```markdown
---
title: [Brief descriptive title]
date: YYYY-MM-DD
category: [bug-fix|integration|performance|architecture|devex|gotcha]
tags: [tag1, tag2, tag3]
module: [affected module, e.g., payments, auth, api]
symptoms: [symptom1, symptom2]
---

# [Title]

## Problem

[What was the issue? What symptoms led you here?]

Example:
> Users were receiving duplicate confirmation emails after signup. Only occurred in production, approximately 3-4 copies of each email.

## Context

[What were you trying to accomplish? What's the broader context?]

Example:
> Implementing a new user onboarding flow. Email confirmation is sent after account creation via background job.

## Investigation

[What did you try? What clues did you find?]

### Initial Hypothesis
[What you first thought was wrong]

### What You Tried
1. [Approach 1] - Result: [what happened]
2. [Approach 2] - Result: [what happened]

### Breakthrough
[What finally led to understanding]

## Root Cause

[What was actually wrong? Why did this happen?]

Example:
> The email sending API lacked an idempotency key. When the frontend retried due to network timeouts, multiple identical requests were processed. The job queue was deduplicating correctly, but the issue was upstream in the API layer.

## Solution

[What fixed it? Include code examples if helpful]

```typescript
// Example of the correct approach
const idempotencyKey = createHash('sha256')
  .update(`${type}:${recipient}:${contentHash}`)
  .digest('hex');

await sendEmail({ ...params, idempotencyKey });
```

### Why This Works

[Explain the fix]

## What Didn't Work

[Approaches that seemed right but failed - helps future searchers]

1. **[First approach]**
   - Tried: [what you did]
   - Result: [what happened]
   - Why it didn't work: [explanation]

2. **[Second approach]**
   - Tried: [what you did]
   - Result: [what happened]
   - Why it didn't work: [explanation]

## Prevention

[How can we prevent this in the future?]

- [ ] Add test case for this scenario
- [ ] Update documentation
- [ ] Consider lint rule or CI check
- [ ] Add monitoring/alerting

## Lessons Learned

- [Key takeaway 1]
- [Key takeaway 2]

## Related

- [Link to relevant code]
- [Link to documentation]
- [Link to external resource]

## Metadata

- **Time to diagnose:** [approximate]
- **Time to fix:** [approximate]
- **Related Linear ticket:** PRA-XXX

```text

## Category Guide

| Category | When to Use | Example |
|----------|-------------|---------|
| `bug-fix` | Unexpected behavior, edge cases | Race condition, off-by-one |
| `integration` | Third-party services, APIs | Stripe webhook quirk |
| `performance` | Optimization discoveries | N+1 query fix |
| `architecture` | Design decisions, patterns | Why we chose X over Y |
| `devex` | Developer experience | Debugging technique |
| `gotcha` | Things that look right but aren't | Timezone handling |

## Tag Suggestions

Common tags to use:

- **Technical:** `race-condition`, `idempotency`, `caching`, `timeout`, `retry`
- **Area:** `database`, `api`, `frontend`, `auth`, `payments`, `email`
- **Type:** `production-only`, `edge-case`, `configuration`, `dependency`

## Quick Learning (for minor discoveries)

```markdown
---
title: [Brief title]
date: YYYY-MM-DD
category: gotcha
tags: [tag]
module: [module]
symptoms: []
---

# [Title]

**TL;DR:** [One sentence summary]

## Details

[Brief explanation]

## Fix

```typescript
// Correct approach
```

```text

## Where to Save

```text
docs/
  solutions/
    2024-01-15-email-duplicate-race-condition.md
    2024-01-10-stripe-webhook-retry-handling.md
    2024-01-05-prisma-transaction-deadlock.md
```

## Naming Convention

`YYYY-MM-DD-short-kebab-case-description.md`

- Use date for sorting
- Keep description under 50 characters
- Use hyphens, not underscores
