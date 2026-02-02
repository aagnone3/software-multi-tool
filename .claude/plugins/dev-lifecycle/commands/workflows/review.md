---
description: Run multi-agent code review on current changes or specified files
---

# Multi-Agent Code Review

Run a comprehensive code review using multiple specialized review agents in parallel.

## Overview

This command orchestrates multiple review agents to analyze code changes from different perspectives:

- **TypeScript Reviewer**: Type safety, patterns, best practices
- **Security Sentinel**: Security vulnerabilities, OWASP concerns
- **Performance Oracle**: Performance issues, bottlenecks
- **Architecture Strategist**: Architecture alignment, patterns
- **Migration Guardian**: Prisma migration safety (when applicable)

## Usage

```text
/workflows:review                    # Review uncommitted changes
/workflows:review --staged           # Review only staged changes
/workflows:review --pr <number>      # Review a specific PR
/workflows:review <file-path>        # Review specific file(s)
```

## Workflow

### Step 1: Identify Changes to Review

**Default (uncommitted changes):**

```bash
git diff --name-only
```

**Staged changes:**

```bash
git diff --staged --name-only
```

**PR changes:**

```bash
gh pr diff <number> --name-only
```

Display to user:

```text
Files to review:
- src/components/Button.tsx (modified)
- packages/api/lib/handler.ts (new)
- packages/database/prisma/migrations/... (migration)
```

### Step 2: Determine Applicable Agents

Based on file types and changes, select relevant agents:

| File Pattern             | Agents                            |
| ------------------------ | --------------------------------- |
| `*.ts`, `*.tsx`          | TypeScript, Security, Performance |
| `*/api/*`                | + Architecture                    |
| `*/prisma/migrations/*`  | + Migration Guardian              |
| `*.sql`                  | Migration Guardian, Security      |
| Any significant changes  | Architecture                      |

### Step 3: Run Review Agents in Parallel

Launch all applicable agents simultaneously:

```typescript
// TypeScript Review
Use Task tool with subagent_type: "dev-lifecycle:review:typescript"
Prompt: "Review these files for TypeScript best practices: [file list]
Focus on: type safety, naming conventions, code patterns, error handling"

// Security Review
Use Task tool with subagent_type: "dev-lifecycle:review:security"
Prompt: "Scan these files for security vulnerabilities: [file list]
Check: input validation, injection risks, authentication, data exposure"

// Performance Review
Use Task tool with subagent_type: "dev-lifecycle:review:performance"
Prompt: "Analyze these files for performance issues: [file list]
Check: N+1 queries, memory leaks, unnecessary re-renders, caching opportunities"

// Architecture Review (if significant changes)
Use Task tool with subagent_type: "dev-lifecycle:review:architecture"
Prompt: "Review architectural alignment of these changes: [file list]
Check: layer separation, dependency direction, pattern consistency"

// Migration Review (if migrations present)
Use Task tool with subagent_type: "dev-lifecycle:review:migration"
Prompt: "Validate Prisma migration safety: [migration files]
Check: reversibility, data preservation, downtime risk, index usage"
```

### Step 4: Aggregate Results

Collect findings from all agents and categorize by severity:

```markdown
## Code Review Summary

### Critical Issues (Must Fix)
- [SECURITY] SQL injection risk in `handler.ts:45`
- [MIGRATION] Non-reversible column drop in migration

### High Priority
- [TYPESCRIPT] Missing error boundary in Button component
- [PERFORMANCE] N+1 query pattern in user loader

### Suggestions
- [ARCHITECTURE] Consider extracting validation logic to shared module
- [TYPESCRIPT] Could use discriminated union for better type narrowing

### Positive Notes
- Good test coverage for new functionality
- Clean separation of concerns in API handler
```

### Step 5: Generate Review Report

Use the review report template to create a structured report:

```text
See: templates/review-report.md
```

Save report to `.claude/reviews/<timestamp>-review.md` if requested.

### Step 6: Offer Next Steps

Based on findings:

**If critical issues found:**

```text
Critical issues must be addressed before merging.
Would you like me to:
1. Help fix these issues now
2. Create a todo list for addressing them
3. Show detailed information about a specific issue
```

**If only suggestions:**

```text
No critical issues found. Suggestions are optional.
Ready to proceed with:
- /dev:pull-request (create PR)
- /dev:merge (if PR exists and approved)
```

## Agent Descriptions

### TypeScript Reviewer

Focuses on:

- Type safety and inference
- Naming conventions (interfaces, variables, functions)
- React patterns and hooks usage
- Error handling patterns
- Code organization

### Security Sentinel

Checks for:

- Injection vulnerabilities (SQL, XSS, command)
- Authentication/authorization issues
- Sensitive data exposure
- OWASP Top 10 concerns
- Hardcoded secrets

### Performance Oracle

Analyzes:

- Database query patterns (N+1, missing indexes)
- Memory usage patterns
- Unnecessary computations
- Caching opportunities
- Bundle size impact

### Architecture Strategist

Evaluates:

- Layer separation (API, domain, infrastructure)
- Dependency direction (clean architecture)
- Pattern consistency
- Module boundaries
- Tech debt implications

### Migration Guardian

Validates:

- Reversibility (can migration be rolled back?)
- Data preservation (no accidental data loss)
- Downtime risk (locks, large table changes)
- Index strategy
- Constraint safety

## Example Interaction

**User:** `/workflows:review`

**Assistant:** Let me identify the changes to review...

```text
Changes detected:
- apps/web/modules/user/components/Profile.tsx (modified)
- packages/api/modules/user/lib/validation.ts (new)
- packages/database/prisma/migrations/20240115_add_user_preferences/migration.sql (new)
```

Running review agents in parallel...

[Launches 5 agents simultaneously]

*After agents complete:*

## Code Review Summary

### Critical Issues (Must Fix)

**[MIGRATION] Non-reversible migration detected**

- File: `migration.sql:12`
- Issue: `DROP COLUMN email_verified` cannot be reversed without data loss
- Fix: Add `ALTER TABLE ADD COLUMN` in down migration with default value

### High Priority

**[SECURITY] Missing input validation**

- File: `validation.ts:25`
- Issue: Email field not validated before database insert
- Fix: Add Zod schema validation: `z.string().email()`

**[PERFORMANCE] Missing database index**

- File: `migration.sql`
- Issue: New `preferences` column queried frequently but not indexed
- Fix: Add `CREATE INDEX idx_user_preferences ON users(preferences)`

### Suggestions

**[TYPESCRIPT] Consider discriminated union**

- File: `Profile.tsx:45`
- Current: `status: 'loading' | 'error' | 'success'` with separate data fields
- Suggestion: Use discriminated union for better type narrowing

### Positive Notes

- Clean component structure in Profile.tsx
- Good error messages in validation.ts
- Migration includes proper transaction handling

---

**2 critical issues require attention before merge.**

Would you like me to help fix these issues?

---
Context: $ARGUMENTS
