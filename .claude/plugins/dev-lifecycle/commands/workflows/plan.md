---
description: Research and groom a Linear ticket by iterating on scope, dependencies, priority, and acceptance criteria
---

# Plan Work

Research context and interactively groom a Linear ticket's scope, dependencies, and metadata, then mark it as ready for work.

> **IMPORTANT: This command is for PLANNING and SCOPING ONLY**
>
> - **DO NOT** create git worktrees, write code, or make commits
> - **DO NOT** create pull requests
> - **DO** use research agents to gather context
> - **DO** explore the codebase to understand the problem
> - **DO** ask clarifying questions and refine acceptance criteria
> - **DO** create or update Linear tickets with well-defined scope
> - **DO** move the ticket from **Inbox** to **Backlog** or **Ready** when grooming is complete

## Pre-Planning Research Phase

Before grooming the ticket, gather context using research agents:

### 1. Research Framework/Library Documentation

If the ticket involves specific libraries or frameworks:

```text
Use Task tool with subagent_type: "dev-lifecycle:research:framework-docs"
Prompt: "Research documentation for [library/framework] relevant to [ticket description]"
```

### 2. Research Best Practices

For architectural or pattern decisions:

```text
Use Task tool with subagent_type: "dev-lifecycle:research:best-practices"
Prompt: "Find best practices for [topic] in [language/framework] context"
```

### 3. Search Internal Learnings

Check for relevant past solutions:

```text
Use Task tool with subagent_type: "dev-lifecycle:research:learnings"
Prompt: "Search for learnings related to [ticket topic] in this codebase"
```

### 4. Analyze Git History (if modifying existing code)

Understand code evolution:

```text
Use Task tool with subagent_type: "dev-lifecycle:research:git-history"
Prompt: "Analyze history of [file/module] to understand design decisions"
```

## State Convention

| State | Meaning | Grooming Target |
| ----- | ------- | --------------- |
| **Inbox** | New ticket (drop zone) | Start here - needs grooming |
| **Backlog** | Groomed, not immediately ready | Groomed but waiting (dependencies, future sprint, low priority) |
| **Ready** | Groomed and ready for work | Developers can pick these up immediately |

**Grooming Flow:** `Inbox → (research + groom) → Backlog OR Ready`

## Input

Accepts either:

- **Existing ticket reference**: e.g., `PRA-123` - fetches and refines the existing ticket
- **New ticket description**: e.g., `"Add dark mode support"` - creates a new ticket from scratch

## Workflow

### Phase 1: Ticket Identification

**If existing ticket provided:**

1. Fetch ticket details using: `pnpm --filter @repo/scripts linear issues view --issue <key>`
2. Display current state to user
3. Ask what aspects they want to refine

**If new ticket description provided:**

1. Acknowledge the idea
2. Begin structured grooming process

### Phase 2: Research Context

Run appropriate research agents based on ticket nature:

1. **Technical tickets**: Research framework docs + best practices
2. **Bug tickets**: Analyze git history for related changes
3. **Feature tickets**: Search learnings + best practices

Present research findings to user before continuing.

### Phase 3: Core Details

Gather these essential details through conversation:

1. **Title** - Clear, actionable summary (start with verb: "Add", "Fix", "Update", etc.)
2. **Description** - Structured markdown including:
   - Problem statement or user story
   - Acceptance criteria
   - Technical considerations (from research)
   - Out of scope items

3. **Test Requirements** - Define what tests need to be written:
   - What new functionality needs test coverage?
   - What test types are needed? (unit, integration, e2e)
   - What edge cases should be tested?
   - What existing tests need updates?

4. **Type** - Determine the nature of work:
   - Bug fix
   - Feature
   - Chore/maintenance
   - Documentation

### Phase 4: Context & Relationships

1. **Project** - Which project does this belong to?
   - List available projects: `pnpm --filter @repo/scripts linear projects list`

2. **Priority** - How urgent is this work?
   - 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low

3. **Dependencies** - Are there blocking relationships?
   - What issues block this work?
   - What issues does this block?
   - Use: `pnpm --filter @repo/scripts linear issues dependency --blocked <key> --blocking <key>`

4. **Milestone** (optional) - Which sprint/milestone?
   - List milestones: `pnpm --filter @repo/scripts linear milestones list --project <ref>`

### Phase 5: Refinement Questions

Ask clarifying questions to ensure scope is well-defined:

- "What's the smallest version of this that would still be valuable?"
- "Are there any edge cases we should consider?"
- "What does 'done' look like for this work?"
- "Is there any existing code or patterns we should follow?"
- "Are there any risks or unknowns?"
- "What tests need to be written to validate this functionality?"

### Phase 6: Summary & Confirmation

Present a complete summary for user approval:

```markdown
## Ticket Summary

**Title:** [title]
**Project:** [project name]
**Priority:** [priority level]
**Type:** [bug/feature/chore/docs]
**Target State:** [Backlog OR Ready - to be determined]

### Research Findings
[Key insights from research phase]

### Description
[full description with acceptance criteria]

### Test Requirements
- [test types needed: unit/integration/e2e]
- [key scenarios to test]
- [edge cases to cover]

### Dependencies
- Blocked by: [list or "None"]
- Blocks: [list or "None"]
```

### Phase 7: Create/Update

**For new tickets:**

```bash
pnpm --filter @repo/scripts linear issues create \
  --title "<title>" \
  --project "<project>" \
  --description "<description>" \
  --priority <0-4> \
  --labels "<comma-separated>"
```

**For dependencies:**

```bash
pnpm --filter @repo/scripts linear issues dependency \
  --blocked <key> \
  --blocking <key>
```

### Phase 8: Determine Target State

Ask: "Is this ticket ready for immediate work, or should it wait?"

**Ready** (immediately workable):

- No blocking dependencies
- High enough priority to work on now
- All requirements are clear

**Backlog** (groomed but waiting):

- Has blocking dependencies
- Lower priority
- Planned for a future sprint

Move to the chosen state using Linear MCP tool.

### Phase 9: STOP - Planning Complete

**STOP HERE. Do not proceed to implementation.**

Once the ticket is created/updated and moved to target state:

1. Confirm the ticket details with the user
2. Provide the Linear ticket URL
3. **End the planning session**

**Never create worktrees, write code, or create PRs as part of this command.**

---
Context: $ARGUMENTS
