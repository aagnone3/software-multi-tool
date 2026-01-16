# Report a Bug

Collect a structured bug report from the user and create a bug ticket in Linear.

## Workflow

1. **Gather Information** - Ask diagnostic questions
2. **Verify Details** - Confirm reproduction steps
3. **Create Issue** - Use Linear skill for ticket creation

> **Note:** New bug tickets are created in **Inbox** status by default.
> They need grooming via `/dev:groom-work` before they can be worked on.

## Required Information

- Bug summary (one sentence)
- Expected vs actual behavior
- Steps to reproduce
- Error messages/stack traces (if any)
- Environment (browser, OS, affected area)

## Diagnostic Questions

1. "What were you trying to do?"
2. "What did you expect to happen?"
3. "What actually happened?"
4. "Can you reproduce this consistently?"
5. "Are there any error messages?"

## Context Gathering

Check these locations:

- Browser console for client errors
- Server logs (`pnpm dev` output)
- Network tab for failed requests

## Severity Guidelines

| Severity | Criteria                               |
| -------- | -------------------------------------- |
| Critical | App crashes, data loss, security issue |
| High     | Feature broken, no workaround          |
| Medium   | Feature broken, has workaround         |
| Low      | Cosmetic, minor inconvenience          |

## Issue Description Template

Use this format when creating the Linear issue:

```markdown
## Summary
[One sentence description]

## Expected Behavior
[What should happen]

## Actual Behavior
[What happens instead]

## Steps to Reproduce
1. ...
2. ...

## Environment
- Browser/OS:
- Affected area:

## Error Details
[Stack traces, console errors]
```

---
Context: $ARGUMENTS
