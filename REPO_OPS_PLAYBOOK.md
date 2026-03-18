# Repository Operations Playbook

## Purpose

A lightweight operating loop for keeping `software-multi-tool` healthy without depending on chat history.

## Standard check

Run:

```bash
git status --short --branch
gh pr list --state open --limit 10
gh run list --limit 10
```

For automation or when running outside the repo root, prefer the repo-qualified form:

```bash
git -C ~/software-multi-tool status --short --branch
gh pr list --repo aagnone3/software-multi-tool --state open --limit 10
gh run list --repo aagnone3/software-multi-tool --limit 10
```

Also note whether the current branch has an upstream configured. A local-only branch is fine temporarily, but it should be an explicit choice rather than drift.

## Default operating loop

1. Check local branch state and whether there is uncommitted work.
2. Review open PRs for merge blockers, failing CI, or stale branches.
3. Review recent workflow runs for flaky or baseline failures.
4. If there is one obvious safe next step, do it immediately.
5. Record what changed and the next step in the ops status file.

## Merge/CI handling

- Prefer concrete workflow evidence over assumptions.
- If a workflow checks out PR code, use immutable refs/SHAs when possible.
- Treat unrelated baseline failures separately from the targeted fix being validated.

## Post-merge housekeeping

1. Confirm local repo is back on `main` and note any untracked work.
2. Verify the merged change produced the expected workflow results on `main`.
3. Separate follow-up cleanup/docs from any newly discovered baseline failures.
4. Capture the next concrete maintenance task before ending the session.

## Local-only branch handling

- If you are on a branch with no upstream, decide explicitly whether it is a temporary scratch branch or something that should become a PR.
- For documentation-only follow-up work, keep the branch small and make the exit condition explicit: commit it, open a PR, or intentionally discard it.
- Before ending a session on a local-only branch, record all three of: branch name, current file(s) changed, and the intended exit path.
- Do not leave repo state ambiguous across sessions; record the branch name and intended outcome in the ops status file.

Quick branch-exit checklist:

1. Is the branch worth keeping? If no, discard it intentionally instead of carrying it forward by accident.
2. If keeping it, is the next move to commit locally or open a PR? Pick one and write it down.
3. If the work is paused, record the exact next edit or command so the next session can resume cold.
4. If `git status --short` shows both staged and unstaged copies of the same file (for example `AM file.md`), either stage the latest draft intentionally or split the change before handing off; do not leave an ambiguous partial stage by accident.

## Baseline issue capture

- When a targeted fix lands cleanly but other failures remain, write them down as a separate queue instead of reopening the merged fix.
- Prefer a small follow-up PR or issue per baseline problem so validation stays attributable.

## Hourly update rule

Hourly status updates should report only:

- work already completed
- the next step that has actually been started, or the specific blocker

Do not claim future work that is not already in motion.
