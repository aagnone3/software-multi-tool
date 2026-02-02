# Changelog

All notable changes to the dev-lifecycle plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

#### Workflow Commands

- `/workflows:plan` - Research and groom Linear tickets with research agent integration
- `/workflows:work` - Execute work on Linear tickets with worktree support
- `/workflows:auto-work` - Auto-pick highest priority ticket from Ready view
- `/workflows:review` - Multi-agent parallel code review
- `/workflows:brainstorm` - Explore requirements before formal planning
- `/workflows:compound` - Document learnings after challenging work

#### Dev Commands

- `/dev:pull-request` - Create or update PRs with organized commits
- `/dev:merge` - Merge PR, close Linear issue, cleanup worktree
- `/dev:migrate-database` - Run Prisma migrations with safety checks
- `/dev:start-apps` - Start dev servers with port conflict handling
- `/dev:stop-apps` - Stop dev servers gracefully
- `/dev:document` - Generate documentation for code changes
- `/dev:report-bug` - Create structured bug tickets in Linear

#### CI Commands

- `/ci:resolve` - Diagnose and fix CI workflow failures

#### Skills Commands

- `/skills:review` - Review skills against best practices

#### Research Agents

- `framework-docs` - Fetch library/framework documentation via Context7
- `best-practices` - Gather external best practices and patterns
- `git-history-analyzer` - Analyze code evolution and design decisions
- `learnings` - Search internal knowledge base in docs/solutions/

#### Review Agents

- `typescript-reviewer` - TypeScript code quality and patterns
- `security-sentinel` - Security vulnerability scanning (OWASP)
- `performance-oracle` - Performance bottleneck detection
- `architecture-strategist` - Architecture alignment review
- `migration-guardian` - Prisma migration safety validation

#### Workflow Agents

- `linear-orchestrator` - Linear issue state management
- `worktree-coordinator` - Parallel development coordination
- `ci-monitor` - CI pipeline monitoring and fixes

#### Templates

- `linear-ticket.md` - Templates for different ticket types
- `pr-description.md` - PR description templates
- `review-report.md` - Code review report format
- `learnings-entry.md` - Learning document format

#### Documentation

- `CLAUDE.md` - Plugin-specific Claude instructions
- `README.md` - Plugin documentation
- `CHANGELOG.md` - This file

### Migration from compound-engineering

This plugin replaces the `compound-engineering@every-marketplace` plugin with:

- Native Linear integration (vs generic issues)
- Native worktree support (vs generic branches)
- Native Prisma migration support
- Research-first planning workflow
- Multi-agent parallel reviews

To migrate:

1. Update `.claude/settings.local.json` to enable `dev-lifecycle@local`
2. Remove `compound-engineering@every-marketplace`
3. Use new command names (e.g., `/workflows:plan` instead of `/plan`)

## [Unreleased]

### Planned

- Slack integration for notifications
- Metrics tracking for development velocity
- Custom review agent composition
- Integration with PostHog for feature flags
