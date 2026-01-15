# Merge Pull Request and Close Linear Issue

When the user runs this command, they are approving the current work and asking you to complete the workflow by merging the PR and closing the Linear issue.

## Required Steps (IN THIS ORDER)

### 1. Verify PR Exists

Check the current branch has an associated PR:

```bash
gh pr view --json number,url,state,mergeable,mergeStateStatus
```

If no PR exists, inform the user and exit.

### 2. Check PR is Mergeable

Verify:

- `state` is `"OPEN"`
- `mergeable` is `"MERGEABLE"`
- `mergeStateStatus` is `"CLEAN"` or `"UNSTABLE"` (if UNSTABLE, warn user but proceed)

If not mergeable, inform user of blockers and exit.

### 3. Merge the Pull Request

```bash
gh pr merge <number> --squash
```

**IMPORTANT**: Do NOT use `--delete-branch` flag - let GitHub's settings handle branch deletion.

### 4. Verify Merge Succeeded

```bash
gh pr view <number> --json state,mergedAt,mergedBy
```

Confirm `state` is `"MERGED"` and `mergedAt` is not null.

If merge failed, inform user and exit. Do NOT proceed to close Linear issue.

### 5. Close Linear Issue (ONLY if PR merge succeeded)

Extract the Linear issue key from:

- Current branch name (e.g., `PRA-28` from `improve-linear-workflow`)
- Or from the PR body (look for `Closes PRA-XX`)
- Or from commit messages

Then close it:

```bash
pnpm --filter @repo/scripts linear issues close --issue <key>
```

### 6. Clean Up Worktree (if applicable)

Check if currently working in a worktree:

```bash
# Check if .git is a file (worktree) or directory (main repo)
if [ -f .git ]; then
  echo "In worktree"
else
  echo "In main repo"
fi
```

If in a worktree:

1. Get the worktree path and parent repo path:

   ```bash
   WORKTREE_PATH=$(pwd)
   PARENT_REPO=$(git worktree list | head -1 | awk '{print $1}')
   WORKTREE_NAME=$(basename "$WORKTREE_PATH")
   ```

2. Navigate to parent repo and clean up:

   ```bash
   cd "$PARENT_REPO"
   git worktree remove ".worktrees/$WORKTREE_NAME"
   git worktree prune
   ```

**Note**: Worktrees cannot checkout main directly since main is used by the parent repo. You must navigate to the parent repo first.

### 7. Switch to Main Branch and Pull Latest

After cleanup, ensure you're on main with latest changes:

```bash
git checkout main && git pull origin main
```

If already on main (after worktree cleanup), just pull:

```bash
git pull origin main
```

### 8. Confirm Completion

Report to user:

- PR #XX merged to main
- Linear issue PRA-XX closed
- Worktree cleaned up (if applicable)
- Switched to main branch and pulled latest changes
- PR URL

## Error Handling

- **If no PR found**: "No PR found for current branch. Please create a PR first."
- **If PR not mergeable**: "PR cannot be merged. Reason: [mergeStateStatus]. Please resolve conflicts/checks."
- **If merge fails**: "Failed to merge PR. Error: [error]. Linear issue NOT closed."
- **If Linear issue close fails**: "PR merged successfully, but failed to close Linear issue. Please close manually."

## Example

```bash
# 1. Check PR
gh pr view --json number,url,state,mergeable,mergeStateStatus

# 2. Merge PR
gh pr merge 47 --squash

# 3. Verify merge
gh pr view 47 --json state,mergedAt

# 4. Close Linear issue
pnpm --filter @repo/scripts linear issues close --issue PRA-28

# 5. Clean up worktree (if in worktree)
cd /path/to/parent/repo
git worktree remove .worktrees/feat-pra-28-feature-name
git worktree prune

# 6. Switch to main and pull
git checkout main && git pull origin main

# 7. Report
# PR #47 merged: https://github.com/org/repo/pull/47
# Linear issue PRA-28 closed
# Worktree cleaned up
# Switched to main branch and pulled latest changes
```

## Critical Rules

1. **NEVER** close the Linear issue before verifying the PR is merged
2. **ALWAYS** verify merge succeeded before closing Linear issue
3. **STOP** if any step fails - do not proceed to next step
4. If user runs this command but no PR exists, this is an error - ask user what they want to do
