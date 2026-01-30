---
name: reflect-for-skill-updates
description: Provides skill improvement guidance for identifying and fixing systemic problems in documentation, automation, and workflows. Activated when conversations reveal gaps that caused issues, confusion, or wasted time.
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

# Reflect for Skill Updates

> **Purpose**: Turn debugging sessions and mistakes into permanent improvements by updating skills, documentation, and automation.

## When to Use This Skill

Invoke this skill when:

- A bug or issue was caused by **missing or incomplete documentation**
- You had to **debug something that a skill should have prevented**
- Configuration was **inconsistent** between components (e.g., different database URLs)
- A workflow step was **missing** from documented procedures
- You discovered a **gotcha** that others will likely hit too
- The user explicitly asks: "Any skills need updating?"

**Activation keywords**: reflect, skill update, documentation gap, prevent this mistake, improve skills, lessons learned

## Reflection Process

### Step 1: Identify the Root Cause

Ask yourself:

1. **What went wrong?** (Symptom)
2. **Why did it go wrong?** (Root cause)
3. **What knowledge would have prevented it?** (Missing documentation)
4. **Where should that knowledge live?** (Skill, CLAUDE.md, setup script, etc.)

### Step 2: Categorize the Fix

| Category | Example | Where to Fix |
| -------- | ------- | ------------ |
| **Missing automation** | Database URLs weren't synced | `worktree-setup.sh` |
| **Missing validation** | No check for port conflicts | Setup scripts, pre-commit hooks |
| **Incomplete skill** | Skill didn't cover edge case | `.claude/skills/<skill>/SKILL.md` |
| **Missing troubleshooting** | Common error not documented | Add to skill's troubleshooting section |
| **Configuration drift** | Env files got out of sync | Add consistency checks |
| **Missing workflow step** | Forgot to run a command | Update skill's workflow steps |

### Step 3: Implement the Fix

#### For Skill Updates

```bash
# Find the relevant skill
ls .claude/skills/

# Read the current skill
cat .claude/skills/<skill-name>/SKILL.md

# Update with new information:
# - Add to troubleshooting section
# - Add to edge cases
# - Update workflow steps
# - Add warnings/notes
```

#### For Automation Fixes

```bash
# Find setup/automation scripts
ls tooling/scripts/src/

# Add validation checks
# Add consistency verification
# Add helpful error messages
```

#### For CLAUDE.md Updates

```bash
# Update project-level documentation
# Add to relevant section
# Cross-reference related skills
```

### Step 4: Verify the Fix

1. **Would this have prevented the original issue?**
2. **Is the fix in the right place?** (Where would someone look for this?)
3. **Is it discoverable?** (Clear headings, keywords, troubleshooting sections)
4. **Does it explain the "why"?** (Not just what to do, but why it matters)

## Reflection Template

Use this template to structure your reflection:

```markdown
## Issue Encountered
[Brief description of what went wrong]

## Root Cause
[Why it happened - the underlying reason]

## Impact
[Time wasted, confusion caused, potential for recurrence]

## Fix Applied
[What was changed and where]

## Prevention
[How this fix prevents future occurrences]
```

## Common Patterns to Watch For

### Configuration Consistency

**Pattern**: Different components using different values for the same thing
**Example**: Web app on Supabase DB, API server on Homebrew Postgres
**Fix**: Add consistency checks in setup scripts

### Missing Prerequisites

**Pattern**: Skill assumes something exists but doesn't verify
**Example**: Skill assumes env file exists but it doesn't
**Fix**: Add prerequisite checks and helpful error messages

### Undocumented Dependencies

**Pattern**: Feature X only works if Y is configured, but Y isn't mentioned
**Example**: Inngest functions require INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to be set
**Fix**: Document dependencies explicitly in the relevant skill

### Silent Failures

**Pattern**: Something fails but there's no error message
**Example**: Job created but never processed, no error shown
**Fix**: Add logging, monitoring, or validation that surfaces the issue

### Workflow Gaps

**Pattern**: Steps are missing from documented procedures
**Example**: "Run dev server" but doesn't mention killing old processes first
**Fix**: Update workflow with complete steps

## Example Reflection

**Issue**: Inngest jobs were created but never processed in local development.

**Root Cause**: The Inngest dev server wasn't running. Unlike production where Inngest Cloud handles job execution, local development requires `npx inngest-cli@latest dev` to be running.

**Impact**: ~20 minutes debugging, user confusion about whether the feature was broken.

**Fix Applied**:

1. Updated `.claude/skills/application-environments/SKILL.md` to mention Inngest dev server
2. Added troubleshooting section to debugging skill
3. Updated local dev quick start to include Inngest

**Prevention**: Future local development setup guidance now explicitly mentions starting the Inngest dev server for background job testing.

## Skills Commonly Needing Updates

| Skill | Common Gaps |
| ----- | ----------- |
| `git-worktrees` | Environment setup, port conflicts, database URLs |
| `architecture` | New integrations, changed patterns |
| `prisma-migrate` | Migration edge cases, schema changes |
| `better-auth` | Auth configuration, session handling |
| `linear-workflow` | Workflow steps, Linear API changes |

## Related Skills

- **agent-skills**: Best practices for creating and improving skills
- **git-worktrees**: Often needs updates based on environment issues
- **architecture**: Central documentation that requires ongoing updates

## Related Resources

- **CLAUDE.md**: Project-level configuration and commands
- **AGENTS.md**: Agent-specific guidance
- **CONTRIBUTING.md**: Contributor workflow documentation
- **Skill files**: `.claude/skills/*/SKILL.md`
- **Setup scripts**: `tooling/scripts/src/`
