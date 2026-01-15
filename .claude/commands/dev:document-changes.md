---
description: Generate documentation updates (skills, CLAUDE.md) for recent code changes
---

# Document Changes

Analyze recent code changes and generate appropriate documentation updates including skills, CLAUDE.md updates, and cross-references.

## When to Use

Use this command after completing a feature or significant change that warrants documentation:

- New features that other developers need to understand
- New patterns or utilities that should be reusable
- Configuration changes that affect workflows
- Integration points between components

## Workflow

### Step 1: Analyze Recent Changes

Identify what was changed by examining:

```bash
# View recent commits on current branch
git log --oneline -10

# View changed files
git diff main...HEAD --name-only

# View the actual changes
git diff main...HEAD
```

Categorize changes into:

- **New features**: Code that adds new capabilities
- **New utilities/patterns**: Reusable code that others might need
- **Configuration**: Environment variables, settings, deployment config
- **Integrations**: Connections between components or external services

### Step 2: Determine Documentation Needs

For each category, decide what documentation is needed:

| Change Type          | Documentation Action                              |
| -------------------- | ------------------------------------------------- |
| Major new feature    | Create new skill in `.claude/skills/<name>/`      |
| New utility/pattern  | Add to existing skill or create new one           |
| Configuration change | Update CLAUDE.md environment section              |
| Integration change   | Update architecture skill + related skills        |
| New command/workflow | Create command in `.claude/commands/`             |

### Step 3: Create or Update Skill

If creating a new skill:

```bash
mkdir -p .claude/skills/<skill-name>
```

Create `SKILL.md` with this structure:

```markdown
---
name: <skill-name>
description: <one-line description for when to use this skill>
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# <Skill Name> Skill

<Brief overview of what this skill covers>

## Quick Reference

| Component | Location |
| --------- | -------- |
| ...       | ...      |

## <Main Content Sections>

<Detailed documentation organized by topic>

## Related Skills

- **<skill>**: <brief description>

## Troubleshooting

<Common issues and solutions>
```

### Step 4: Update Related Documentation

1. **Update architecture skill** if the change affects system architecture:
   - Add to Quick Reference table
   - Add section describing the feature
   - Update Related Skills

2. **Update cicd skill** if the change affects deployment/preview:
   - Add environment variables
   - Add troubleshooting steps

3. **Update CLAUDE.md** if the change affects daily development:
   - Add new commands
   - Add new environment variables
   - Update workflow sections

### Step 5: Add Cross-References

Ensure documentation is discoverable:

1. Add skill to Related Skills in relevant existing skills
2. Reference skill in CLAUDE.md if appropriate
3. Link to skill from code comments where helpful

### Step 6: Verify Documentation

- Check all code paths mentioned exist
- Verify environment variable names match code
- Ensure file paths are accurate
- Test any commands or scripts documented

## Output Format

After completing documentation, provide a summary:

```text
Documentation Updates:

New Skills Created:
- .claude/skills/<name>/SKILL.md - <description>

Skills Updated:
- .claude/skills/architecture/SKILL.md - Added <feature> section
- .claude/skills/cicd/SKILL.md - Added <troubleshooting> section

CLAUDE.md Updates:
- Added <section> to <area>

Cross-References Added:
- <skill1> → <skill2>
- <skill2> → <skill3>
```

## Examples

### Example: Documenting a New API Feature

```text
User: /dev:document-changes

Analysis:
- New API proxy route added at apps/web/app/api/proxy/
- New environment detection utilities in packages/utils/lib/api-url.ts
- Affects preview environment authentication

Documentation Actions:
1. Created .claude/skills/api-proxy/SKILL.md
2. Updated architecture skill with API Proxy section
3. Updated cicd skill with authentication troubleshooting
4. Added cross-references to related skills
```

### Example: Documenting a Configuration Change

```text
User: /dev:document-changes

Analysis:
- New Stripe webhook events added
- New environment variable STRIPE_WEBHOOK_ENDPOINT

Documentation Actions:
1. Updated CLAUDE.md Stripe Webhooks section
2. Updated .env.local.example with new variable
3. Updated stripe-webhooks skill if exists
```

## Notes

- Focus on documentation that will help future developers
- Keep documentation DRY - reference other skills rather than duplicating
- Use consistent formatting across all documentation
- Include troubleshooting for common issues you encountered
- Link to external documentation when appropriate

Context: $ARGUMENTS
