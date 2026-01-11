---
description: Groom a Linear ticket by iterating on scope, dependencies, priority, and acceptance criteria with the user
---

# Groom Work

Interactively flesh out a Linear ticket's scope, dependencies, and metadata.

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

### Phase 2: Core Details

Gather these essential details through conversation:

1. **Title** - Clear, actionable summary (start with verb: "Add", "Fix", "Update", etc.)
2. **Description** - Structured markdown including:
   - Problem statement or user story
   - Acceptance criteria
   - Technical considerations
   - Out of scope items

3. **Test Requirements** - Define what tests need to be written:
   - What new functionality needs test coverage?
   - What test types are needed? (unit, integration, e2e)
   - What edge cases should be tested?
   - What existing tests need updates?
   - Example: "Need unit tests for content extraction, integration tests for Claude API calls, e2e tests for UI flow"

4. **Type** - Determine the nature of work:
   - Bug fix
   - Feature
   - Chore/maintenance
   - Documentation

### Phase 3: Context & Relationships

1. **Project** - Which project does this belong to?
   - List available projects: `pnpm --filter @repo/scripts linear projects list`
   - Help user choose appropriate project

2. **Priority** - How urgent is this work?
   - 0 = No priority
   - 1 = Urgent
   - 2 = High
   - 3 = Medium
   - 4 = Low

3. **Dependencies** - Are there blocking relationships?
   - What issues block this work?
   - What issues does this block?
   - Use: `pnpm --filter @repo/scripts linear issues dependency --blocked <key> --blocking <key>`

4. **Milestone** (optional) - Which sprint/milestone?
   - List milestones: `pnpm --filter @repo/scripts linear milestones list --project <ref>`

5. **Labels** (optional) - Categorization tags

### Phase 4: Refinement Questions

Ask clarifying questions to ensure scope is well-defined:

- "What's the smallest version of this that would still be valuable?"
- "Are there any edge cases we should consider?"
- "What does 'done' look like for this work?"
- "Is there any existing code or patterns we should follow?"
- "Are there any risks or unknowns?"
- **"What tests need to be written to validate this functionality?"**
- **"What test scenarios should we cover (happy path, edge cases, error handling)?"**

### Phase 5: Summary & Confirmation

Present a complete summary for user approval:

```markdown
## Ticket Summary

**Title:** [title]
**Project:** [project name]
**Priority:** [priority level]
**Type:** [bug/feature/chore/docs]

### Description
[full description with acceptance criteria]

### Test Requirements
- [test types needed: unit/integration/e2e]
- [key scenarios to test]
- [edge cases to cover]
- [existing tests to update]

### Dependencies
- Blocked by: [list or "None"]
- Blocks: [list or "None"]

### Milestone
[milestone or "Unassigned"]

### Labels
[labels or "None"]
```

### Phase 6: Create/Update

**For new tickets:**

```bash
pnpm --filter @repo/scripts linear issues create \
  --title "<title>" \
  --project "<project>" \
  --description "<description>" \
  --priority <0-4> \
  --labels "<comma-separated>"
```

**For existing tickets:**

- Note: The CLI doesn't have an update command
- Provide the user with the refined details to update manually in Linear
- Or offer to create a new ticket with the refined scope

**For dependencies:**

```bash
pnpm --filter @repo/scripts linear issues dependency \
  --blocked <key> \
  --blocking <key>
```

**For milestone assignment:**

```bash
pnpm --filter @repo/scripts linear issues set-milestone \
  --issue <key> \
  --project <project> \
  --milestone <milestone>
```

## Conversation Guidelines

- Ask ONE question at a time to avoid overwhelming the user
- Provide examples when asking for input
- Suggest defaults based on the description when possible
- Validate that scope is appropriately sized (not too large)
- Encourage breaking large work into smaller tickets if needed

## Example Interaction

**User:** `/dev:groom-work Add ability to export analytics data`

**Assistant:** I'll help you groom this ticket. Let's start with the basics.

**Title:** "Add analytics data export functionality"

Is this title clear and actionable, or would you like to refine it?

[... continues through each phase ...]

---
Context: $ARGUMENTS
