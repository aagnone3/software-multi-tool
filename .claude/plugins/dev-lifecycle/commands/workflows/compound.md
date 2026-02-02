---
description: Document learnings and institutional knowledge after completing challenging work
---

# Compound Knowledge

Capture and document learnings after completing challenging work to build institutional knowledge.

## Purpose

Use this command after completing work that involved:

- Non-obvious solutions or workarounds
- Debugging sessions with hard-to-find root causes
- Integration challenges with external services
- Performance optimizations with specific trade-offs
- Architectural decisions with important rationale

**Output:** A structured learning document saved to `docs/solutions/` for future reference.

## Workflow

### Phase 1: Identify What Was Learned

Review recent work to identify learnings:

```bash
# View recent commits
git log --oneline -10

# View changed files
git diff HEAD~5...HEAD --name-only
```

Ask the user:

```text
What challenged you about this work? Examples:
- "The API kept returning 500 errors until I realized..."
- "I had to work around a library limitation by..."
- "The performance was bad because..."
- "I chose this approach instead of the obvious one because..."
```

### Phase 2: Gather Context

For each learning, gather structured context:

**Problem Context:**

- What were you trying to do?
- What was the initial symptom or blocker?
- What did you expect to happen vs what actually happened?

**Investigation:**

- What approaches did you try that didn't work?
- What was the key insight or breakthrough?
- How long did this take to figure out?

**Solution:**

- What was the actual fix or approach?
- Why does this work when other approaches didn't?
- Are there any trade-offs or limitations?

### Phase 3: Categorize the Learning

Determine the type of learning:

| Category | Examples |
|----------|----------|
| `bug-fix` | Unexpected behavior, race conditions, edge cases |
| `integration` | Third-party APIs, services, library quirks |
| `performance` | Query optimization, caching strategies |
| `architecture` | Design decisions, pattern choices |
| `devex` | Tooling, debugging techniques, workflow improvements |
| `gotcha` | Things that look right but are wrong |

### Phase 4: Create Learning Document

Use the learning entry template to create a structured document:

**File location:** `docs/solutions/<date>-<short-description>.md`

```markdown
---
title: [Brief descriptive title]
date: YYYY-MM-DD
category: [category from above]
tags: [relevant-tag-1, relevant-tag-2]
module: [affected module, e.g., "payments", "auth", "api"]
symptoms: [list of symptoms that led to this issue]
---

# [Title]

## Problem

[What was the issue? What symptoms led you here?]

## Context

[What were you trying to accomplish? What's the broader context?]

## Root Cause

[What was actually wrong? Why did this happen?]

## Solution

[What fixed it? Include code examples if helpful]

```typescript
// Example of the correct approach
```

## What Didn't Work

[Approaches that seemed right but failed - helps future searchers]

1. **[First approach]** - Didn't work because...
2. **[Second approach]** - Didn't work because...

## Prevention

[How can we prevent this in the future?]

- [ ] Add test case for this scenario
- [ ] Update documentation
- [ ] Consider lint rule or CI check

## Related

- [Link to relevant documentation]
- [Link to related learning]
- [Link to external resource]

```text

### Phase 5: Cross-Reference

After creating the learning document:

1. **Update relevant skill documentation** if the learning affects a documented workflow
2. **Add to CLAUDE.md** if it's a common gotcha developers should know
3. **Consider creating a test** that would have caught this issue

```bash
# Check if there's a relevant skill to update
ls .claude/skills/
```

### Phase 6: Commit the Learning

```bash
git add docs/solutions/<learning-file>.md
git commit -m "docs: add learning about [brief description]

Category: [category]
Module: [affected module]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Example Interaction

**User:** `/workflows:compound`

**Assistant:** Let me help you document what you learned.

Looking at your recent commits...

```text
Recent work:
- fix: resolve email sending race condition
- feat: add retry logic to payment processor
```

What was the most challenging part of this work?

**User:** The email race condition took forever to figure out. Emails were being sent multiple times.

**Assistant:** Let me gather the details for this learning.

What was the initial symptom that led you to investigate?

**User:** Users were getting 3-4 copies of the same email. Only happened in production.

**Assistant:** What did you try that didn't work?

**User:** I thought it was the email provider at first. Then I thought it was our job queue. Turned out to be a React StrictMode double-render triggering the API twice in dev, but in prod it was actually a missing idempotency key.

**Assistant:** Got it. Let me create the learning document...

*Creates `docs/solutions/2024-01-15-email-duplicate-race-condition.md`:*

**Example learning document:**

> **Title:** Email Duplication from Missing Idempotency Key
>
> **Problem:** Users receiving 3-4 copies of the same email. Only occurred in production, not in development.
>
> **Root Cause:** The API endpoint for sending emails lacked an idempotency key. When the frontend retried due to network timeouts, multiple identical requests were processed.
>
> **Solution:** Added idempotency key based on email type + recipient + content hash.
>
> **Approaches that didn't work:** (1) Blamed email provider, (2) Checked job queue, (3) Disabled React StrictMode - fixed dev but not prod.
>
> **Prevention:** Add idempotency keys to all email endpoints, add integration test for duplicate prevention.

Document created! Should I also update the mail module skill with this gotcha?

---
Context: $ARGUMENTS
