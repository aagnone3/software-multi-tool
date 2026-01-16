---
description: Auto-pick the highest priority groomed issue from "Ready for Work" view and start working on it
---

# Perform Work

Automatically select the highest priority groomed issue (in **Ready** state) from the "Ready for Work" Linear view and begin working on it.

> **Note:** Only issues in **Ready** state appear in this view.
>
> - Issues in **Inbox** need grooming first - use `/dev:groom-work` to groom them.
> - Issues in **Backlog** are already groomed but not yet ready - move them to Ready when it's time to work on them.

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
2. Groom an Inbox ticket using: /dev:groom-work (then move to Ready)
3. Move a Backlog ticket to Ready if it's now workable
4. Check for ungroomed tickets: pnpm --filter @repo/scripts linear issues list --project <project-name> --state Inbox
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
PRA-45   Ready       High      Add user profile settings page
PRA-42   Ready       Medium    Fix navigation breadcrumb styling
PRA-38   Ready       Low       Update README with setup instructions
```

> **Note:** All issues shown are in **Ready** state (groomed and immediately workable).
> Inbox issues need grooming first. Backlog issues are groomed but not yet ready.

**Auto-selected:** PRA-45 - Add user profile settings page (Priority: High)

Starting work on PRA-45...

*Invokes `/dev:work-on-ticket PRA-45`*
