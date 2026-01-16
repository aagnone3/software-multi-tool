---
description: Review all Claude skills against best practices and suggest improvements
---

# Review Claude Skills

Analyze all skills in `.claude/skills/` against best practices from the `agent-skills` skill and suggest improvements.

## Arguments

- `--dry-run` - Analyze and report without making changes
- `--auto-approve` - Apply improvements without confirmation (for CI use)
- `<skill-name>` - Review only a specific skill (e.g., `skills:review architecture`)

Context: $ARGUMENTS

## Workflow

### Step 1: Load Best Practices

Read the agent-skills skill to understand best practices:

```bash
cat .claude/skills/agent-skills/SKILL.md
cat .claude/skills/agent-skills/checklist.md
```

### Step 2: Discover Skills

Find all skills in the repository:

```bash
find .claude/skills -name "SKILL.md" -type f | grep -v agent-skills | sort
```

If a specific skill was provided as an argument, filter to only that skill.

### Step 3: Review Each Skill

For each skill, analyze against the checklist in `.claude/skills/agent-skills/checklist.md`:

#### 3.1 Read the Skill

```bash
cat .claude/skills/<skill-name>/SKILL.md
```

Also read any supporting files (examples.md, etc.) if present.

#### 3.2 Score Against Checklist

Evaluate each item from the checklist:

**Core Quality Checks:**

- Description is specific with key terms
- Description includes what AND when
- Description uses third person
- SKILL.md under 500 lines
- Progressive disclosure used if needed
- No time-sensitive information
- Consistent terminology
- Concrete examples
- File references one level deep

**Frontmatter Checks:**

- Valid name (lowercase, hyphens, max 64 chars)
- Gerund form name preferred
- Non-empty description (max 1024 chars)
- Allowed-tools specified

**Structure Checks:**

- Quick Reference table (if applicable)
- Clear section organization
- Related Skills section
- When to Use section

#### 3.3 Generate Improvement Suggestions

For each failed check, generate a specific improvement:

```text
## <skill-name> Skill Review

**Score**: X/25

### Issues Found

1. **Description uses first person** (Core Quality)
   - Current: "I help you process PDFs"
   - Suggested: "Processes PDFs and extracts text. Use when working with PDF files."

2. **Missing When to Use section** (Structure)
   - Add section at end before Related Skills

### Recommended Changes

[Specific edits to make]
```

### Step 4: Apply Improvements (unless --dry-run)

For each skill with improvements:

#### 4.1 Show Proposed Changes

Display the proposed changes to the user:

```text
## Proposed changes to <skill-name>

### SKILL.md changes:
- Update description from "..." to "..."
- Add "When to Use" section
- Add "Related Skills" section
```

#### 4.2 Confirm or Auto-Apply

If `--auto-approve` is set, apply changes directly.

Otherwise, ask the user: Apply these changes to skill-name? (y/n/skip-all)

#### 4.3 Make the Changes

Use the Edit tool to apply approved changes to the skill files.

### Step 5: Create Per-Skill Commits

After improving each skill, create a commit:

```bash
git add .claude/skills/<skill-name>/
git commit -m "chore(skills): improve <skill-name> skill

- <improvement 1>
- <improvement 2>
- <improvement 3>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 6: Create Summary Report

After reviewing all skills, output a summary:

```text
# Skills Review Summary

## Skills Reviewed: X

## Skills Improved: Y

| Skill | Before | After | Changes |
| --- | --- | --- | --- |
| architecture | 18/25 | 23/25 | +description, +related skills |
| linear | 20/25 | 24/25 | +when to use |

## Skills Skipped: Z
- agent-skills (reference skill)

## Commits Created: Y
```

### Step 7: Create Pull Request (unless --dry-run)

If changes were made and not in dry-run mode:

```bash
BRANCH="chore/improve-skills-$(date +%Y%m%d)"
git checkout -b "$BRANCH"
git push -u origin "$BRANCH"

gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "chore(skills): automated skill improvements" \
  --body "## Summary

Automated skill review and improvement based on best practices from the agent-skills skill.

## Review Process

Each skill was evaluated against the checklist covering:
- Core quality (conciseness, descriptions, progressive disclosure)
- Frontmatter (naming, description)
- Content structure (sections, cross-references)
- Workflow clarity

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

## Improvement Guidelines

When suggesting improvements, focus on:

### High-Priority Improvements

1. **Description quality** - Critical for skill discovery
2. **Missing When to Use section** - Helps users know when to invoke
3. **Missing Related Skills** - Improves discoverability

### Medium-Priority Improvements

1. **Terminology consistency** - Pick one term and use throughout
2. **Example concreteness** - Replace abstract with concrete
3. **Progressive disclosure** - Split if over 500 lines

### Low-Priority Improvements

1. **Gerund naming** - Only if skill is being renamed anyway
2. **Quick Reference tables** - Only if skill has many components

## Notes

- The `agent-skills` skill itself is never modified (it's the reference)
- Focus on structural improvements, not major content rewrites
- Keep changes minimal and targeted
- Each skill gets its own commit for easy review
- Run with `--dry-run` first to preview changes
