# Claude Skills

This directory contains Claude skills that provide specialized guidance for working with this codebase.

## Available Skills

### agent-skills

**Description**: Use this skill when creating, reviewing, or improving Claude skills. Provides best practices from Anthropic's official skill authoring guide including conciseness, degrees of freedom, naming conventions, description writing, progressive disclosure, and quality evaluation criteria.

**Location**: `.claude/skills/agent-skills/`

**When to Use**:

- Creating a new skill
- Reviewing existing skills for improvements
- Understanding skill best practices
- Optimizing skill descriptions for discovery
- Structuring skill content for progressive disclosure

**Related Skills**: architecture, tools

**Related Commands**: `/skills:review` - Automated skill review and improvement

---

### ai

**Description**: Use this skill when working with AI/LLM features, adding AI processors, configuring AI providers (Anthropic/OpenAI), or understanding the AI architecture. Covers Claude via @repo/agent-sdk and OpenAI via @repo/ai.

**Location**: `.claude/skills/ai/`

**When to Use**:

- Working with AI/LLM features
- Adding new AI processors
- Configuring Anthropic or OpenAI
- Understanding the AI architecture
- Model selection guidance

**Related Skills**: architecture, tools, async-jobs

---

### analytics

**Description**: Use this skill when implementing event tracking, working with PostHog analytics, swapping analytics providers, or adding analytics to new features. Provides guidance on the pluggable analytics system and PostHog configuration.

**Location**: `.claude/skills/analytics/`

**When to Use**:

- Implementing event tracking
- Working with PostHog analytics
- Swapping analytics providers
- Adding analytics to new features

**Related Skills**: architecture, tools

---

### architecture

**Description**: Use this skill when exploring the codebase structure, understanding integrations, or navigating the monorepo. Provides comprehensive architecture overview including API layer, frontend, database, and external integrations.

**Location**: `.claude/skills/architecture/`

**When to Use**:

- Exploring codebase structure
- Understanding integrations
- Navigating the monorepo
- Learning about system architecture

**Related Skills**: tools, better-auth, analytics

---

### better-auth

**Description**: Use this skill when working with authentication, user management, sessions, organizations, or any auth-related features. Provides context on Better Auth configuration, plugins, and patterns used in this project.

**Location**: `.claude/skills/better-auth/`

**When to Use**:

- Working with authentication
- User management
- Sessions and organizations
- Auth-related features

**Related Skills**: architecture, tools, debugging

---

### debugging

**Description**: Use this skill when debugging applications across platforms (Vercel, Supabase, Render) and environments (local, preview, production). Covers log access, error patterns, connection troubleshooting, and performance monitoring.

**Location**: `.claude/skills/debugging/`

**When to Use**:

- Accessing logs for any platform (Vercel, Supabase, Render)
- Troubleshooting application errors
- Debugging database connection issues
- Investigating session/authentication problems
- Resolving preview environment issues
- Performance monitoring and optimization
- Production incident investigation

**Related Skills**: architecture, api-proxy, cicd, render, better-auth, prisma-migrate

---

### git-worktrees

**Description**: Use this skill when working on multiple features in parallel, need isolated development environments, or want to review PRs locally. Provides git worktree patterns optimized for pnpm monorepos.

**Location**: `.claude/skills/git-worktrees/`

**When to Use**:

- Parallel development on multiple features
- Local PR review without branch switching
- Hotfix main while preserving in-progress work
- Isolated testing environments

**Related Skills**: linear, github-cli, linear-workflow

---

### github-cli

**Description**: Use this skill for all GitHub operations including creating pull requests, managing issues, and using the GitHub API. This skill enforces using the aagnone3 GitHub account for all operations in the aagnone3 organization.

**Location**: `.claude/skills/github-cli/`

**When to Use**:

- Creating pull requests
- Managing GitHub issues
- Using the GitHub API
- GitHub operations

**Related Skills**: linear, linear-workflow, git-worktrees

---

### linear

**Description**: Use this skill when the user needs to interact with Linear for project management tasks including listing/managing projects, creating/listing milestones, managing issue dependencies, closing issues, or assigning issues to milestones. This skill wraps the Linear CLI helpers and provides comprehensive Linear workflow support.

**Location**: `.claude/skills/linear/`

**When to Use**:

- Linear project management
- Creating/managing milestones
- Managing issue dependencies
- Closing issues
- Assigning issues to milestones

**Related Skills**: linear-workflow, github-cli, git-worktrees

---

### linear-workflow

**Description**: Complete Linear-based development workflow for planning, implementing, and shipping features.

**Location**: `.claude/skills/linear-workflow/`

**When to Use**:

- Following the complete development workflow
- Planning feature implementation
- Shipping features end-to-end

**Related Skills**: linear, github-cli, git-worktrees

---

### prisma-migrate

**Description**: Use this skill for Prisma database migration workflows including validation, staging, review, and execution. This skill wraps the Prisma CLI and custom migration helpers.

**Location**: `.claude/skills/prisma-migrate/`

**When to Use**:

- Creating database migrations
- Validating Prisma schemas
- Staging and reviewing migrations
- Executing migrations
- Database schema changes

**Related Skills**: architecture, git-worktrees

---

### tools

**Description**: Use this skill when adding new tools/sub-apps to the application, understanding the multi-app architecture, or modifying existing tools. Provides guidance on the tool registry, routing structure, and shared layouts.

**Location**: `.claude/skills/tools/`

**When to Use**:

- Adding new tools or sub-apps
- Understanding multi-app architecture
- Modifying existing tools
- Tool registry and routing

**Related Skills**: architecture, analytics, better-auth

---

## Skill Structure

Each skill typically contains:

- **SKILL.md**: Main documentation with YAML frontmatter
- **examples.md** (optional): Real-world usage examples
- **README.md** (optional): Quick reference guide

## Adding a New Skill

1. Create a new directory in `.claude/skills/<skill-name>/`
2. Add `SKILL.md` with proper YAML frontmatter:

   ```yaml
   ---
   name: skill-name
   description: Use this skill when... [activation triggers and description]
   allowed-tools:
     - Bash
     - Read
     - Edit
     - Write
     - Grep
     - Glob
   ---
   ```

3. Optionally add `examples.md` and `README.md`
4. Update this index with the new skill entry

## Skill Activation

Skills activate based on keywords and patterns in user queries. The `description` field in each skill's YAML frontmatter determines when it's triggered.

**Example**:

- Query: "How do I add analytics to a new feature?"
- Activates: `analytics` skill
- Reason: Matches "add analytics" in description
