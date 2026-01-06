---
description: Auto-pick the highest priority issue from "Ready for Work" view and start working on it
---

# Perform Work

Automatically select the highest priority issue from the "Ready for Work" Linear view and begin working on it.

## Workflow

### Step 1: Fetch Issues from Ready-for-Work View

Query the "Ready for Work" view to get available issues:

```bash
pnpm --filter @repo/scripts linear views list-issues --view ready-for-work-6ec4d06793a6
```

### Step 2: Auto-Select Highest Priority Issue

The view is pre-sorted by priority. Select the **first issue** in the list (highest priority).

Display to user:

```text
Auto-selected: <ISSUE-KEY> - <title> (Priority: <priority>)
```

### Step 3: Invoke Work-On Workflow

Once selected, invoke the `dev:work-on-ticket` command to handle the complete development workflow:

```text
/dev:work-on-ticket <selected-issue-key>
```

**IMPORTANT:** Do NOT duplicate the work-on workflow here. The `dev:work-on-ticket.md` command contains the complete, authoritative workflow for:

- Starting the issue (moving to In Progress)
- Creating a feature branch
- Creating a todo list
- Implementing changes
- Running tests
- Committing and pushing
- Creating a pull request

## Error Handling

### No Issues in View

If the view returns no issues:

```text
No issues are currently in the "Ready for Work" view.

Options:
1. Check the Linear view directly in your browser
2. Groom a ticket using: /dev:groom-work
3. Check project backlog: pnpm --filter @repo/scripts linear issues list --project <project-name>
```

### View Not Found

If the view cannot be resolved:

```text
Could not find the "Ready for Work" view (ready-for-work-6ec4d06793a6).

Please verify:
1. The view exists in your Linear workspace
2. Your LINEAR_API_KEY has access to this view
3. The view slug is correct
```

## Example Interaction

**User:** `/dev:perform-work`

**Assistant:** Let me check the "Ready for Work" view for available issues...

*Runs: `pnpm --filter @repo/scripts linear views list-issues --view ready-for-work-6ec4d06793a6`*

```text
Issues in view "Ready for Work" (3 issues):

KEY      STATUS     PRIORITY  TITLE
---      ------     --------  -----
PRA-45   Backlog    High      Add user profile settings page
PRA-42   Backlog    Medium    Fix navigation breadcrumb styling
PRA-38   Backlog    Low       Update README with setup instructions
```

**Auto-selected:** PRA-45 - Add user profile settings page (Priority: High)

Starting work on PRA-45...

*Invokes `/dev:work-on-ticket PRA-45`*
