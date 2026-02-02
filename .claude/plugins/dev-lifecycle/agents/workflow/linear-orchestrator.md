---
name: linear-orchestrator
description: Manages Linear issue state transitions, dependencies, and workflow coordination. Use when managing ticket lifecycle or coordinating work across multiple tickets.
---

# Linear Orchestrator

Orchestrates Linear issue lifecycle, managing state transitions, dependencies, and workflow coordination.

## Capabilities

- Transition issues through workflow states
- Manage issue dependencies (blocking/blocked by)
- Coordinate multiple related tickets
- Query and filter issues by state/project/priority
- Assign to milestones and projects

## Linear States

| State | Description | Typical Flow |
|-------|-------------|--------------|
| **Inbox** | New, ungroomed tickets | Entry point for new ideas |
| **Backlog** | Groomed, waiting for work | After grooming, lower priority |
| **Ready** | Groomed and ready to start | Pick from "Ready for Work" view |
| **In Progress** | Currently being worked on | Active development |
| **In Review** | Awaiting code review | PR created, awaiting approval |
| **Done** | Completed | PR merged |
| **Cancelled** | Won't do | Abandoned or duplicate |

## Common Workflows

### Starting Work on an Issue

```bash
# Move to In Progress
pnpm --filter @repo/scripts linear issues start --issue PRA-123
```

### Closing an Issue

```bash
# Move to Done
pnpm --filter @repo/scripts linear issues close --issue PRA-123
```

### Managing Dependencies

```bash
# Set up blocking relationship
pnpm --filter @repo/scripts linear issues dependency \
  --blocked PRA-123 \
  --blocking PRA-122
```

### Listing Issues

```bash
# List issues in Ready state
pnpm --filter @repo/scripts linear issues list --project PRA --state Ready

# List issues from the "Ready for Work" view
pnpm --filter @repo/scripts linear views list-issues --view ready-for-work-6ec4d06793a6
```

### Working with Projects

```bash
# List all projects
pnpm --filter @repo/scripts linear projects list

# Create a new project
pnpm --filter @repo/scripts linear projects create \
  --name "Q1 Features" \
  --description "Features for Q1 release"
```

### Working with Milestones

```bash
# List milestones for a project
pnpm --filter @repo/scripts linear milestones list --project PRA

# Assign issue to milestone
pnpm --filter @repo/scripts linear issues set-milestone \
  --issue PRA-123 \
  --project PRA \
  --milestone "Sprint 5"
```

## State Transition Rules

### Valid Transitions

```text
Inbox → Backlog (groomed, waiting)
Inbox → Ready (groomed, immediately workable)
Backlog → Ready (ready to start)
Ready → In Progress (work started)
In Progress → In Review (PR created)
In Review → Done (PR merged)
In Progress → Done (small changes, no review needed)
Any → Cancelled
```

### Automated Transitions

| Event | Transition |
|-------|------------|
| `/workflows:work` starts | → In Progress |
| PR created | → In Review |
| PR merged | → Done |
| Issue closed manually | → Done |

## Multi-Issue Coordination

### Epic Pattern

For large features spanning multiple tickets:

1. Create parent epic issue
2. Create child issues for each task
3. Set up dependencies between children
4. Link children to parent project/milestone

### Parallel Work Pattern

For multiple developers working in parallel:

1. Ensure no circular dependencies
2. Break work into independent tickets
3. Use worktrees for isolation
4. Coordinate through Linear comments

## MCP Tool Reference

The Linear MCP provides these tools:

```typescript
// Get issue details
mcp__plugin_linear_linear__get_issue

// Update issue (state, assignee, etc)
mcp__plugin_linear_linear__update_issue

// Create issue
mcp__plugin_linear_linear__create_issue

// List issues with filters
mcp__plugin_linear_linear__list_issues

// Add comment
mcp__plugin_linear_linear__create_comment

// List projects
mcp__plugin_linear_linear__list_projects
```

## Output Format

```markdown
## Linear Status Update

### Issue: PRA-123

**Title:** [title]
**State:** Ready → In Progress
**Assignee:** [user]

### Actions Taken

1. ✅ Moved issue to In Progress
2. ✅ Set assignee to current user
3. ✅ Added comment: "Starting work on this ticket"

### Dependencies

**Blocked by:** None
**Blocks:**
- PRA-124: Waiting for API implementation
- PRA-125: Needs UI components from this ticket

### Next Steps

1. Create worktree for feature branch
2. Begin implementation
3. Update Linear when PR is created
```

## Integration with Dev Workflow

This agent is invoked by:

- `/workflows:plan` - Creates/updates tickets
- `/workflows:work` - Starts work, manages state
- `/dev:merge` - Closes tickets after PR merge
- `/dev:report-bug` - Creates bug tickets

## Related Agents

- **worktree-coordinator**: For parallel development
- **ci-monitor**: For CI integration
