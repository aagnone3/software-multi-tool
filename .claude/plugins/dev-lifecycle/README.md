# Dev Lifecycle Plugin

Complete development lifecycle orchestration for Linear-based workflows with git-worktrees, Prisma, and Supabase.

## Overview

This plugin consolidates development commands and adds compound-engineering-inspired components:

- Workflow commands for the complete development cycle
- Research agents for gathering context before implementation
- Review agents for multi-perspective code review
- Workflow agents for coordination

## Installation

The plugin is local to this repository. Enable it in `.claude/settings.local.json`:

```json
{
  "enabledPlugins": {
    "dev-lifecycle@local": true
  }
}
```

## Commands

### Workflow Commands

| Command | Description |
|---------|-------------|
| `/workflows:plan` | Research and groom a Linear ticket |
| `/workflows:work` | Execute work on a Linear ticket |
| `/workflows:auto-work` | Auto-pick highest priority ticket |
| `/workflows:review` | Run multi-agent code review |
| `/workflows:brainstorm` | Explore requirements before planning |
| `/workflows:compound` | Document learnings after challenging work |

### Dev Commands

| Command | Description |
|---------|-------------|
| `/dev:pull-request` | Create or update a pull request |
| `/dev:merge` | Merge PR and close Linear issue |
| `/dev:migrate-database` | Run Prisma migrations |
| `/dev:start-apps` | Start local dev servers |
| `/dev:stop-apps` | Stop local dev servers |
| `/dev:document` | Generate documentation for changes |
| `/dev:report-bug` | Create a bug ticket in Linear |

### CI Commands

| Command | Description |
|---------|-------------|
| `/ci:resolve` | Diagnose and fix CI failures |

### Skills Commands

| Command | Description |
|---------|-------------|
| `/skills:review` | Review skills against best practices |

## Agents

### Research Agents

- **framework-docs** - Fetch library/framework documentation
- **best-practices** - Gather external best practices
- **git-history-analyzer** - Analyze code evolution
- **learnings** - Search internal knowledge base

### Review Agents

- **typescript-reviewer** - TypeScript code review
- **security-sentinel** - Security vulnerability scanning
- **performance-oracle** - Performance analysis
- **architecture-strategist** - Architecture alignment
- **migration-guardian** - Prisma migration safety

### Workflow Agents

- **linear-orchestrator** - Linear state management
- **worktree-coordinator** - Parallel development
- **ci-monitor** - CI monitoring and fixing

## Typical Workflow

```text
1. /workflows:brainstorm     - Explore the idea
2. /workflows:plan           - Create/groom the ticket
3. /workflows:work           - Implement (creates worktree)
4. /workflows:review         - Multi-agent review
5. /dev:pull-request         - Create PR
6. /ci:resolve               - Fix any CI issues
7. /dev:merge                - Merge and close
8. /workflows:compound       - Document learnings
```

## Dependencies

This plugin references these skills (does not duplicate them):

- `git-worktrees`
- `linear`
- `linear-workflow`
- `prisma-migrate`
- `github-cli`
- `cicd`
- `debugging`

## Directory Structure

```text
.claude/plugins/dev-lifecycle/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── agents/
│   ├── research/             # Research agents
│   ├── review/               # Review agents
│   └── workflow/             # Workflow agents
├── commands/
│   ├── workflows/            # Workflow commands
│   ├── dev/                  # Development commands
│   ├── ci/                   # CI commands
│   └── skills/               # Skills commands
├── skills/
│   └── dev-lifecycle.md      # Main skill entry point
├── templates/                # Document templates
├── CLAUDE.md                 # Plugin-specific instructions
├── README.md                 # This file
└── CHANGELOG.md              # Version history
```

## Configuration

The plugin uses these settings from `plugin.json`:

```json
{
  "config": {
    "linearTeam": "PRA",
    "readyForWorkView": "ready-for-work-6ec4d06793a6",
    "defaultBranch": "main",
    "worktreeDir": ".worktrees"
  }
}
```

## Contributing

To add new commands or agents:

1. Create the appropriate markdown file in the correct directory
2. Follow the existing patterns and templates
3. Update this README if adding new capabilities
4. Update CHANGELOG.md with changes

## License

Part of the software-multi-tool repository.
