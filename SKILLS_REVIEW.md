# Skills Review — 2026-04-07

Automated review of all 22 skills in `.claude/skills/` against best practices from the `agent-skills` checklist.

> **Note for reviewers**: The skill file improvements below are ready to apply but require explicit permission grants in `.claude/settings.local.json` for the CI runner to write to `.claude/` paths. To apply the changes, run `git apply skills-improvements.patch` or manually apply the diffs below.

---

## Summary

**Skills Reviewed**: 22  
**Skills with Improvements**: 3 (minor consistency fixes)  
**Skills Requiring No Changes**: 19  

All skills are in strong shape overall — correct gerund names, specific descriptions, related-skills sections, when-to-use sections, and allowed-tools specified. The three improvements below address a terminology consistency gap.

---

## Scores

| Skill | Score | Issues |
| ----- | ----- | ------ |
| `integrating-ai` | 24/25 | — |
| `tracking-analytics` | 24/25 | — |
| `configuring-environments` | 24/25 | — |
| `navigating-architecture` | 24/25 | — |
| `implementing-auth` | 23/25 | — |
| `managing-cicd` | 24/25 | — |
| `using-cli` | 23/25 | — |
| `debugging-applications` | 24/25 | — |
| `managing-feature-flags` | 24/25 | — |
| `using-git-worktrees` | 24/25 | — |
| `managing-github-cli` | 22/25 | Description has embedded shell command |
| `implementing-icons` | 22/25 | "When to Use" uses "Use" not "Invoke" |
| `designing-landing-pages` | 22/25 | "When to Use" uses "Use" not "Invoke" |
| `implementing-linear-workflow` | 24/25 | — |
| `managing-linear` | 24/25 | — |
| `managing-prisma-migrations` | 23/25 | — |
| `reflecting-for-improvements` | 24/25 | — |
| `managing-storage` | 24/25 | — |
| `testing-stripe-webhooks` | 24/25 | — |
| `developing-sub-apps` | 23/25 | — |
| `configuring-tools` | 23/25 | — |
| `managing-typography` | 24/25 | — |

---

## Proposed Changes

### 1. `iconography` — Fix "When to Use" phrasing

**File**: `.claude/skills/iconography/SKILL.md`  
**Issue**: Uses "Use this skill when:" while all other skills use "Invoke this skill when:"  
**Fix**:

```diff
-Use this skill when:
+Invoke this skill when:
```

### 2. `landing-page-design` — Fix "When to Use" phrasing

**File**: `.claude/skills/landing-page-design/SKILL.md`  
**Issue**: Uses "Use this skill when:" while all other skills use "Invoke this skill when:"  
**Fix**:

```diff
-Use this skill when:
+Invoke this skill when:
```

### 3. `github-cli` — Clean up description field

**File**: `.claude/skills/github-cli/SKILL.md`  
**Issue**: The description frontmatter embeds a shell command `(gh auth switch -u aagnone3)` which is unusual in a discovery-focused description field.  
**Fix**:

```diff
-description: GitHub CLI workflows for PRs, issues, and repository operations with account switching (aagnone3), authentication troubleshooting, and API access. Requires aagnone3 account for all operations (gh auth switch -u aagnone3). Use when creating pull requests, managing issues, or switching GitHub accounts.
+description: GitHub CLI workflows for PRs, issues, and repository operations with account switching (aagnone3), authentication troubleshooting, and API access. Requires the aagnone3 account for all operations. Use when creating pull requests, managing issues, or switching GitHub accounts.
```

---

## Skills Requiring No Changes (19)

These skills scored 23-24/25 and meet all checklist requirements:

- `integrating-ai` — Complete, well-structured, excellent progressive disclosure
- `tracking-analytics` — Good provider architecture documentation
- `configuring-environments` — Clear troubleshooting section
- `navigating-architecture` — Excellent codebase reference skill
- `implementing-auth` — Comprehensive auth coverage
- `managing-cicd` — Clear pipeline documentation
- `using-cli` — Good command reference with error handling patterns
- `debugging-applications` — Excellent quick-fixes table and scenario coverage
- `managing-feature-flags` — Full server+client coverage with testing
- `using-git-worktrees` — Mandatory workflow clearly documented
- `implementing-linear-workflow` — Clear implementation checklist
- `managing-linear` — Good CLI command reference
- `managing-prisma-migrations` — Safety rules prominently highlighted
- `reflecting-for-improvements` — Good reflection template
- `managing-storage` — Multi-tenant path conventions well documented
- `testing-stripe-webhooks` — Account alignment troubleshooting is clear
- `developing-sub-apps` — Comprehensive tool creation workflow
- `configuring-tools` — Good credit system documentation
- `managing-typography` — Clear font configuration guide

---

## How to Apply Changes

```bash
# Option 1: Manual edits
# Edit each file listed above applying the diffs

# Option 2: Automated (requires write permission to .claude/)
# Add to .claude/settings.local.json permissions.allow:
# "Edit(.claude/skills/**)", "Write(.claude/skills/**)"
# Then re-run: /skills:review --auto-approve
```
