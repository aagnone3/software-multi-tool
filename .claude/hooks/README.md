# Claude Code Hooks

This directory contains custom hooks for Claude Code that enforce project best practices.

## block-no-verify.py

**Purpose:** Prevents Claude from using `git commit --no-verify`, which bypasses pre-commit hooks.

**Why:** Pre-commit hooks exist to catch issues (formatting, linting, tests) before they reach CI. Bypassing them leads to:

- CI failures that could have been caught locally
- Extra commits to fix formatting/lint issues
- Wasted CI resources and time

**What it does:**

- Blocks any `git commit` command that includes `--no-verify`
- Shows a helpful error message explaining why
- Reminds that if hooks are failing, fix the root cause instead of bypassing

**Exception:** If pre-commit hooks themselves are genuinely broken and need urgent fixes, you can temporarily disable this hook by commenting it out in `.claude/settings.local.json`.

## How Hooks Work

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-no-verify.py"
          }
        ]
      }
    ]
  }
}
```

When Claude tries to use the Bash tool, this hook runs first and can:

- Exit 0: Allow the command
- Exit 2: Block the command and show error to Claude
- Exit 1: Error (non-blocking)

## Testing Hooks

Test a hook manually:

```bash
echo '{"tool_name": "Bash", "tool_input": {"command": "your-command"}}' | .claude/hooks/your-hook.py
```

## Adding More Hooks

To add additional safety checks:

1. Create a new Python script in this directory
2. Make it executable: `chmod +x .claude/hooks/your-hook.py`
3. Add it to `.claude/settings.local.json` under the appropriate event
4. Test it to ensure it works as expected
