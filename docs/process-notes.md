# Ticket Delivery Notes

These notes outline a repeatable workflow for taking a Linear ticket from intake to an open pull request. Ticket `PRA-6 – Add Vitest and testing-library dependencies across workspaces` is used as the running example.

## Communication Cadence

- Drive tickets forward without waiting for prompts; surface updates when you start work, encounter blockers, open a PR, or need coordination outside an active ticket.
- After a ticket merges, confirm the next assignment or any coordination needs before beginning new implementation work.

## 1. Intake & Triage

- Pull current ticket details from Linear (title, description, acceptance criteria, checklists, linked issues). Confirm project/epic context and state.
- Clarify scope: capture any implicit dependencies or blocked tasks. For `PRA-6`, list every workspace expected to consume Vitest or testing-library utilities.
- Record outstanding questions, and post them back to the Linear issue before implementation begins.

## 2. Environment Readiness

- Verify local tooling matches repo expectations (`pnpm@10.14.0`, Node >= 20, pre-commit hooks installed).
- Sync the main branch (`git fetch`, `git status`) and ensure the working tree is clean or changes are intentionally staged.
- Confirm required secrets (`LINEAR_API_KEY`, etc.) exist in `apps/web/.env.local` so helper scripts and API clients work.

## 3. Implementation Plan

- Draft a lightweight technical plan (in the PR description or a temporary scratchpad) before modifying files.
- Identify code touchpoints:
  - Root scripts/config (`package.json`, `turbo.json`, shared configs under `tooling/`).
  - Workspace package manifests and tsconfigs (e.g., `apps/web/package.json`, `packages/*/package.json`).
  - Shared setup directories to be created (`tests/setup/*`, `tooling/test/*`).
- For `PRA-6`, enumerate dependency versions to pin (Vitest core, @testing-library/react, jsdom types, coverage plugins) and note which workspaces require them.

## 4. Branching & Tracking

- As soon as work starts, update the Linear ticket status to `In Progress` so the team sees ownership.

**Note on ticket readiness:**

- **Backlog** tickets need grooming first (use `/dev:groom-work`)
- **Ready** tickets are groomed and ready for work
- Only pick up tickets from **Ready** state, not **Backlog**

- Create a feature branch named after the ticket (`git checkout -b PRA-6-testing-deps`).
- Copy the initial plan into the Linear issue as a comment to confirm scope and approach.
- Post a short kickoff update in the ticket describing what landed already and what’s next.
- If work will span multiple sessions, capture intermediate status updates in Linear (remaining tasks, blockers, TODOs).
- Push incremental updates to the remote branch regularly (`git push --set-upstream origin <branch>` on first push, then `git push`) so reviewers can follow progress.

## 5. Execution

- Make focused commits grouped by concern (e.g., dependency additions vs. config scaffolding).
- Leverage repo tooling:
  - Use `pnpm install` to refresh the lockfile after dependency changes.
  - Run `pnpm lint` / `pnpm check` to catch formatting or static issues early.
- When propagating dependency updates across many workspaces, prefer a small Node script to edit each `package.json`, then sort dependency blocks to keep diffs readable.
- Before wrapping up a coding session, pause and confirm whether a PR exists; if not, push the branch and open one before writing a final status update.
- Resolve peer dependency warnings immediately (e.g., adding `postcss` to satisfy `jsdom` when introducing Vitest) so CI won’t fail later.
- Run workspace-specific type checks (`pnpm --filter web run type-check`, etc.) after installing new packages to surface missing types before the hook runs.
- For `PRA-6` specifically:
  - Update root and workspace `package.json` files with testing dependencies and scripts.
  - Add shared config files (`tooling/test/vitest.workspace.ts`, etc.) as placeholders if they unblock follow-up tickets.

## 6. Validation

- Execute the minimal test suite impacted by the change (initially lint + `pnpm test -- --runInBand` once implemented).
- Capture command output summaries for the PR description.
- Re-run checks after resolving review feedback or rebasing.

## 7. Documentation & Changelog

- Update any relevant docs (README sections, internal guides) affected by the ticket’s changes.
- Mention follow-up work uncovered during implementation (e.g., configuration gaps) and either open additional Linear issues or note them as subtasks.

## 8. Pull Request Prep

- Push the feature branch (`git push --set-upstream origin PRA-6-testing-deps`).
- Open the PR as soon as the checklist above is complete—no additional approval is required to share the work.
- Draft the PR:
  - Title `[PRA-6] Add Vitest scaffolding dependencies`.
  - Include context, summary of changes, testing evidence, and links back to the Linear ticket.
- Double-check that the PR is live and linked in Linear before delivering your status update or handing the ticket off.
- Re-run `pnpm lint` (and other fast checks) just before opening to ensure CI parity.
- When using the GitHub CLI locally, switch to the `aagnone3` profile first (`gh auth switch --user aagnone3`) before creating the PR.
- Ensure the Linear ticket has the PR link once opened and adjust status to `In Review`.

## 9. Post-PR Follow-up

- Update the Linear ticket with the PR link and move it to `In Review`.
- Respond promptly to reviewer comments; keep the Linear issue status synchronized with progress.
- After approval and merge, run cleanup tasks (delete the branch, confirm CI succeeded) and close or update the ticket to `Done`.

## Checklist Template

- [ ] Review Linear ticket context and dependencies.
- [ ] Confirm local environment + secrets are set.
- [ ] Write a short implementation plan.
- [ ] Create feature branch and mark ticket `In Progress`.
- [ ] Implement changes with targeted commits.
- [ ] Run lint/tests and capture results.
- [ ] Update docs or notes as needed.
- [ ] Push branch, craft PR, link Linear issue.
- [ ] Update ticket status through review and merge.
