# Linear Skill

A unified Claude Code skill for managing Linear projects, milestones, and issues.

## Quick Start

This skill is automatically invoked when you ask Claude to:

- List or search Linear projects
- Create or manage project dependencies
- Create or list milestones for sprints/releases
- Assign issues to milestones
- **Start work on issues** (moves to "In Progress" status)
- Close completed issues
- Set up issue dependencies (blockers)

## Files in this Skill

- **SKILL.md** - Main skill definition with comprehensive command reference
- **examples.md** - Real-world workflow examples and patterns
- **README.md** - This file (skill overview)

## Prerequisites

1. Set `LINEAR_API_KEY` in `apps/web/.env.local`:

   ```bash
   LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
   ```

2. The skill uses existing Linear CLI helpers at `tooling/scripts/src/linear/index.mjs`

## Common Use Cases

### Starting Work

"Start working on issue PRA-45" - Automatically moves the issue to "In Progress"

### Sprint Planning

"Create a milestone called 'Sprint 10' for the 'Mobile App' project targeting December 15th"

### Issue Management

"Assign issue PRA-45 to the 'Sprint 10' milestone in the 'Mobile App' project"

### Dependency Tracking

"Mark PRA-30 as blocked by PRA-28"

### Project Roadmapping

"List all active projects and create a dependency where 'Phase 2' is blocked by 'Phase 1'"

### Complete Workflow

"Start work on PRA-45, and when I'm done, close it" - Manages the full issue lifecycle

## Manual Usage

You can also run Linear commands directly:

```bash
pnpm --filter @repo/scripts linear help
```

See `SKILL.md` for complete command reference and `examples.md` for detailed workflows.

## Architecture

This skill leverages:

- **Claude Code Skills framework** - Auto-invocation based on user intent
- **Existing CLI helpers** - Robust Linear SDK integration
- **Tool restrictions** - Only uses Bash for security
- **Progressive documentation** - Claude loads examples only when needed

## Extending the Skill

To add new Linear operations:

1. Update `tooling/scripts/src/linear/index.mjs` with new commands
2. Add command documentation to `SKILL.md`
3. Add usage examples to `examples.md`
4. Update the skill description in `SKILL.md` frontmatter if needed
