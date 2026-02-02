# Linear Ticket Template

Use this template when creating new Linear issues via `/workflows:plan` or `/dev:report-bug`.

## Feature/Enhancement

```markdown
## Summary
[One sentence describing what this feature does]

## User Story
As a [type of user], I want [goal] so that [benefit].

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

## Technical Considerations
- [Architecture/design consideration]
- [Integration point]
- [Performance consideration]

## Test Requirements
- **Unit tests:** [what needs unit testing]
- **Integration tests:** [what needs integration testing]
- **E2E tests:** [if applicable, what user flows to test]

## Out of Scope
- [Explicitly what this does NOT include]

## Dependencies
- Blocked by: [PRA-XXX if any]
- Blocks: [PRA-XXX if any]

## References
- [Link to design]
- [Link to documentation]
```

## Bug Report

```markdown
## Summary
[One sentence description of the bug]

## Expected Behavior
[What should happen]

## Actual Behavior
[What happens instead]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Environment
- Browser/OS: [e.g., Chrome 120 on macOS]
- Environment: [production/staging/local]
- User role: [if relevant]

## Error Details

[Stack trace or console error]

## Screenshots

[If applicable]

## Severity

- [ ] Critical (app crashes, data loss, security)
- [ ] High (feature broken, no workaround)
- [ ] Medium (feature broken, has workaround)
- [ ] Low (cosmetic, minor inconvenience)

## Test Requirements

- Test to add: [what test would prevent regression]
```

## Chore/Maintenance

```markdown
## Summary
[What maintenance work needs to be done]

## Motivation
[Why this is needed - tech debt, performance, security, etc.]

## Tasks
- [ ] [Specific task]
- [ ] [Specific task]

## Risks
- [Any risks or breaking changes]

## Verification
- [How to verify the work is complete]
```

## Documentation

```markdown
## Summary
[What documentation needs to be created/updated]

## Current State
[What exists now, or "None"]

## Proposed Changes
- [Change 1]
- [Change 2]

## Target Audience
[Who will use this documentation]

## Acceptance Criteria
- [ ] [Documentation exists at specified location]
- [ ] [Content covers specified topics]
- [ ] [Examples are provided]
```

## Metadata Quick Reference

When creating tickets via CLI:

```bash
pnpm --filter @repo/scripts linear issues create \
  --title "<title>" \
  --project "<project>" \
  --description "<description>" \
  --priority <0-4> \
  --labels "<comma-separated>"
```

### Priority Levels

| Value | Level | When to Use |
|-------|-------|-------------|
| 0 | None | Default, will be triaged |
| 1 | Urgent | Production issues, blockers |
| 2 | High | Important, needed soon |
| 3 | Medium | Standard priority |
| 4 | Low | Nice to have |

### Common Labels

- `bug` - Bug reports
- `enhancement` - New features
- `tech-debt` - Technical debt
- `documentation` - Docs updates
- `security` - Security issues
