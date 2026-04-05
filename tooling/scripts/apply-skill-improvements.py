#!/usr/bin/env python3
"""
Apply skill improvements from the automated skills review (2026-04-05).

Usage:
  python3 tooling/scripts/apply-skill-improvements.py

This script applies targeted improvements to skills in .claude/skills/.
Run from the repository root with write permissions to .claude/ directory.

To enable automated runs, add to .claude/settings.local.json:
  "permissions": {
    "allow": ["Edit(.claude/skills/**)", "Write(.claude/skills/**)"]
  }
"""

import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE, ".claude", "skills")


def read_skill(skill_name: str) -> str:
    path = os.path.join(SKILLS_DIR, skill_name, "SKILL.md")
    with open(path) as f:
        return f.read()


def write_skill(skill_name: str, content: str) -> None:
    path = os.path.join(SKILLS_DIR, skill_name, "SKILL.md")
    with open(path, "w") as f:
        f.write(content)
    print(f"  ✅ Updated: .claude/skills/{skill_name}/SKILL.md")


def apply(skill_name: str, old: str, new: str) -> bool:
    content = read_skill(skill_name)
    if old in content:
        write_skill(skill_name, content.replace(old, new))
        return True
    print(f"  ⚠️  Expected text not found in {skill_name}/SKILL.md")
    return False


# ---------------------------------------------------------------------------
# Improvements
# ---------------------------------------------------------------------------

IMPROVEMENTS = []


def improvement(skill_name: str, description: str):
    """Decorator to register an improvement function."""
    def decorator(fn):
        IMPROVEMENTS.append((skill_name, description, fn))
        return fn
    return decorator


@improvement("github-cli", "Remove redundant aagnone3 mention in description")
def fix_github_cli_description():
    return apply(
        "github-cli",
        (
            "description: GitHub CLI workflows for PRs, issues, and repository operations "
            "with account switching (aagnone3), authentication troubleshooting, and API access. "
            "Requires aagnone3 account for all operations (gh auth switch -u aagnone3). "
            "Use when creating pull requests, managing issues, or switching GitHub accounts."
        ),
        (
            "description: GitHub CLI workflows for PRs, issues, and repository operations "
            "with authentication troubleshooting and API access. "
            "Always requires the aagnone3 account \u2014 run gh auth switch -u aagnone3 before any operation. "
            "Use when creating pull requests, managing issues, querying the GitHub API, "
            "or troubleshooting GitHub authentication."
        ),
    )


@improvement("tools", "Add note that credit costs should be verified in config/index.ts")
def fix_tools_credit_costs():
    return apply(
        "tools",
        "### Credit Costs by Tool\n\n| Tool                 | Credits | Unit         |",
        (
            "### Credit Costs by Tool\n\n"
            "> **Note**: Values below are defaults. Always verify current credit costs in `config/index.ts`.\n\n"
            "| Tool                 | Credits | Unit         |"
        ),
    )


@improvement("ai", "Add AgentSession and multi-turn keywords to activation keywords")
def fix_ai_keywords():
    return apply(
        "ai",
        (
            "**Activation keywords**: AI, LLM, Claude, Anthropic, OpenAI, processor, "
            "model selection, streaming, executePrompt, agent-sdk, @anthropic-ai/sdk, "
            "@repo/agent-sdk, @repo/ai, anthropic import, streamText, generateText, "
            "useChat, claude_agent_sdk"
        ),
        (
            "**Activation keywords**: AI, LLM, Claude, Anthropic, OpenAI, processor, "
            "model selection, streaming, executePrompt, AgentSession, multi-turn session, "
            "agent-sdk, @anthropic-ai/sdk, "
            "@repo/agent-sdk, @repo/ai, anthropic import, streamText, generateText, "
            "useChat, claude_agent_sdk"
        ),
    )


@improvement(
    "feature-flags",
    "Clarify that POSTHOG_API_KEY and NEXT_PUBLIC_POSTHOG_KEY are the same key value",
)
def fix_feature_flags_env_comment():
    return apply(
        "feature-flags",
        "# Server-side requires the project API key (same as client key for PostHog)\nPOSTHOG_API_KEY=phc_your_project_key",
        "# Server-side evaluation key (same value as NEXT_PUBLIC_POSTHOG_KEY, different env var name)\nPOSTHOG_API_KEY=phc_your_project_key",
    )


@improvement(
    "prisma-migrate",
    "Surface the BEGIN/COMMIT warning earlier in Step 4 review section heading",
)
def fix_prisma_migrate_begin_commit():
    content = read_skill("prisma-migrate")
    old = "#### MANDATORY MANUAL STEP - DO NOT SKIP\n\nThe migration file will be at:"
    new = (
        "#### MANDATORY MANUAL STEP - DO NOT SKIP\n\n"
        "> **Reminder**: Never add `BEGIN`/`COMMIT` \u2014 Prisma wraps each migration in a transaction automatically (see Safety Rules below).\n\n"
        "The migration file will be at:"
    )
    if old in content:
        # Only apply if not already present
        if "Never add `BEGIN`/`COMMIT`" not in content[:content.index("The migration file will be at:") + 100]:
            write_skill("prisma-migrate", content.replace(old, new))
            return True
        else:
            print("  Already improved — skipping.")
            return False
    print(f"  ⚠️  Expected text not found in prisma-migrate/SKILL.md")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"Applying skill improvements to: {SKILLS_DIR}\n")

    results = []
    for skill_name, description, fn in IMPROVEMENTS:
        print(f"[{skill_name}] {description}")
        try:
            changed = fn()
            results.append((skill_name, description, changed))
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            results.append((skill_name, description, False))
        print()

    changed_count = sum(1 for _, _, c in results if c)
    print(f"\nSummary: {changed_count}/{len(results)} skills improved")
    for skill_name, description, changed in results:
        status = "✅" if changed else "⚠️ "
        print(f"  {status} {skill_name}: {description}")

    sys.exit(0 if changed_count > 0 else 1)
