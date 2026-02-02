# Pull Request Description Template

Use this template when creating PRs via `/dev:pull-request` or `/workflows:work`.

## Standard PR

```markdown
## Summary
- [Key change 1]
- [Key change 2]
- [Key change 3]

## Related Issue
Closes PRA-XXX

## Changes

### Added
- [New feature/file]

### Changed
- [Modified behavior]

### Fixed
- [Bug fix]

### Removed
- [Deprecated code]

## Test Plan
- [ ] New unit tests added
- [ ] Existing tests updated
- [ ] E2E tests added (if applicable)
- [ ] Manual testing completed

### How to Test
1. [Step to test]
2. [Expected result]

## Screenshots
[If UI changes, before/after screenshots]

## Checklist
- [ ] Code follows project style guide
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
```

## Feature PR

```markdown
## Summary
Implements [feature name] for [use case].

- [Key capability 1]
- [Key capability 2]

## Related Issue
Closes PRA-XXX

## Implementation Details

### Architecture
[Brief description of approach taken]

### Key Components
- `path/to/file.ts` - [purpose]
- `path/to/other.ts` - [purpose]

### Database Changes
[If any migrations included]

## Test Plan
- Unit tests: `pnpm test path/to/tests`
- Integration tests: `pnpm test:integration`
- Manual testing:
  1. [Test scenario 1]
  2. [Test scenario 2]

## Deployment Notes
[Any special deployment considerations]

## Screenshots
| Before | After |
|--------|-------|
| [image] | [image] |
```

## Bug Fix PR

```markdown
## Summary
Fixes [brief description of bug].

## Root Cause
[What was causing the issue]

## Solution
[How this PR fixes it]

## Related Issue
Closes PRA-XXX

## Test Plan
- Added regression test: `path/to/test.ts`
- Verified fix:
  1. [Reproduction steps no longer produce bug]
  2. [Expected behavior now works]

## Risk Assessment
- **Impact:** [Low/Medium/High]
- **Areas affected:** [list]
- **Rollback plan:** [if applicable]
```

## Refactor PR

```markdown
## Summary
Refactors [area] to [improvement].

## Motivation
- [Why this refactor is needed]
- [What problem it solves]

## Changes
- [Structural change 1]
- [Structural change 2]

## Related Issue
Closes PRA-XXX (or "No issue - tech debt")

## Verification
- [ ] All existing tests pass
- [ ] No behavior changes (unless documented)
- [ ] Performance not degraded

## Migration Notes
[If any breaking changes or migration needed]
```

## Dependencies Update PR

```markdown
## Summary
Updates dependencies to latest versions.

## Updated Packages
| Package | From | To | Notes |
|---------|------|-----|-------|
| `package-a` | 1.0.0 | 2.0.0 | Breaking changes |
| `package-b` | 3.1.0 | 3.2.0 | Patch update |

## Breaking Changes
[List any breaking changes and how they were addressed]

## Test Plan
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Manual smoke test completed
```

## Quick Reference

### Commit Co-Author

All commits should include:

```text
Co-Authored-By: Claude <noreply@anthropic.com>
```

### PR Labels

Apply appropriate labels:

- `feature` - New functionality
- `bugfix` - Bug fixes
- `chore` - Maintenance
- `docs` - Documentation
- `refactor` - Code refactoring

### Creating via CLI

```bash
gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "type: brief description" \
  --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Related Issue
Closes PRA-XXX

## Test Plan
- [How to test]
EOF
)"
```
