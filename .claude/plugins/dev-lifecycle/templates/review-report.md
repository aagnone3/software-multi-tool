# Code Review Report Template

Use this template when generating review reports via `/workflows:review`.

## Full Review Report

```markdown
# Code Review Report

**Date:** YYYY-MM-DD
**Reviewer:** Claude (multi-agent review)
**Scope:** [PR #XXX / uncommitted changes / specific files]

## Executive Summary

**Overall Assessment:** [Pass / Pass with Notes / Needs Changes / Block]

| Category | Issues Found | Severity |
|----------|--------------|----------|
| TypeScript | X | [Critical/High/Medium] |
| Security | X | [Critical/High/Medium] |
| Performance | X | [Critical/High/Medium] |
| Architecture | X | [Critical/High/Medium] |
| Migration | X | [Critical/High/Medium] |

## Files Reviewed

| File | Lines Changed | Issues |
|------|---------------|--------|
| `path/to/file.ts` | +50, -10 | 2 |
| `path/to/other.ts` | +100, -0 | 0 |

---

## Critical Issues

> These must be addressed before merge.

### [CRIT-1] [Issue Title]

**Agent:** [TypeScript/Security/Performance/etc]
**File:** `path/to/file.ts:45`
**Severity:** Critical

**Current Code:**
```typescript
// Problematic code
```

**Problem:** [Explanation of the issue]

**Impact:** [What could go wrong]

**Fix:**

```typescript
// Corrected code
```

---

## High Priority Issues

> Should be addressed; may be deferred with justification.

### [HIGH-1] [Issue Title]

**Agent:** [Agent name]
**File:** `path/to/file.ts:23`

[Description and fix as above]

---

## Suggestions

> Optional improvements for consideration.

### [SUGGEST-1] [Suggestion Title]

**Agent:** [Agent name]
**File:** `path/to/file.ts:100`

**Current:**

```typescript
// Current approach
```

**Suggested:**

```typescript
// Improved approach
```

**Benefit:** [Why this is better]

---

## Positive Notes

Commendable practices observed:

- ✅ [Good practice 1]
- ✅ [Good practice 2]
- ✅ [Good practice 3]

---

## Agent Reports

### TypeScript Reviewer

- Issues found: X
- Key concerns: [summary]

### Security Sentinel

- Issues found: X
- Key concerns: [summary]

### Performance Oracle

- Issues found: X
- Key concerns: [summary]

### Architecture Strategist

- Issues found: X
- Key concerns: [summary]

### Migration Guardian

- Issues found: X
- Key concerns: [summary]

---

## Next Steps

Based on this review:

1. [ ] Address critical issue CRIT-1
2. [ ] Address high priority issue HIGH-1
3. [ ] Consider suggestion SUGGEST-1
4. [ ] Re-run review after changes

```text

## Quick Review Summary

For inline/quick reviews:

```markdown
## Quick Review

**Status:** [Pass/Needs Changes]

### Must Fix
- [Issue 1 with fix]

### Should Fix
- [Issue 2 with fix]

### Optional
- [Suggestion]
```

## Issue Severity Guide

| Severity | Description | Action |
|----------|-------------|--------|
| **Critical** | Security vulnerability, data loss risk, crash | Block merge |
| **High** | Functionality broken, significant bug | Should fix before merge |
| **Medium** | Minor bug, suboptimal pattern | Fix or document why not |
| **Low** | Style, minor optimization | Optional |
| **Info** | Suggestion, observation | FYI only |

## Agent-Specific Markers

```markdown
[TYPESCRIPT] Type safety issue
[SECURITY] Security vulnerability
[PERF] Performance concern
[ARCH] Architectural concern
[MIGRATION] Database migration issue
```
