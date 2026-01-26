# CLI Skill

Developer CLI (`mt`) for the software-multi-tool monorepo. Provides commands for development workflows, feature flag inspection, and tooling automation.

## Quick Reference

| Command | Description |
| ------- | ----------- |
| `pnpm mt features` | Display PostHog feature flag status |
| `pnpm mt features --json` | Output feature flags as JSON |
| `pnpm mt --help` | Show available commands |

## When to Use This Skill

Use this skill when:

- Running CLI commands for development workflows
- Adding new CLI commands to the tooling
- Debugging CLI issues or extending functionality
- Understanding the CLI architecture

**Activation keywords**: CLI, mt command, feature flags, developer tooling, pnpm mt

## Architecture

The CLI lives in `tooling/cli/` and uses:

- **commander.js**: Command-line argument parsing and subcommands
- **chalk**: Terminal colors and styling
- **cli-table3**: Formatted table output
- **posthog-node**: PostHog SDK for feature flag evaluation
- **tsx**: TypeScript execution without compilation
- **dotenv-cli**: Environment variable loading

### Directory Structure

```text
tooling/cli/
├── package.json          # CLI package with dependencies
├── tsconfig.json         # TypeScript configuration
└── src/
    ├── index.ts          # Entry point, command registration
    └── commands/
        └── features.ts   # Feature flags command
```

### Entry Point (`src/index.ts`)

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { featuresCommand } from "./commands/features.js";

const program = new Command();

program
  .name("mt")
  .description("Developer CLI for software-multi-tool")
  .version("0.0.0");

program.addCommand(featuresCommand);

program.parse();
```

## Available Commands

### `mt features`

Display PostHog feature flags with their current status and values.

**Usage:**

```bash
pnpm mt features           # Table output with colors
pnpm mt features --json    # JSON output for scripting
```

**Output (table):**

```text
PostHog Feature Flags
=====================

┌──────────────┬────────┬─────────┬────────────┐
│ Flag         │ Status │ Rollout │ Your Value │
├──────────────┼────────┼─────────┼────────────┤
│ new-feature  │ ON     │ 100%    │ true       │
│ beta-test    │ PARTIAL│ 50%     │ false      │
└──────────────┴────────┴─────────┴────────────┘

2 flags total (1 enabled, 1 partial, 0 disabled)
```

**Output (JSON):**

```json
{
  "flags": [
    {
      "key": "new-feature",
      "status": "enabled",
      "rollout": "100%",
      "value": true
    }
  ],
  "summary": {
    "total": 1,
    "enabled": 1,
    "partial": 0,
    "disabled": 0
  }
}
```

**Environment Variables Required:**

- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog API host (defaults to `https://us.i.posthog.com`)

The CLI automatically loads these from `apps/web/.env.local`.

## Adding New Commands

### Step 1: Create Command File

Create a new file in `tooling/cli/src/commands/`:

```typescript
// tooling/cli/src/commands/mycommand.ts
import chalk from "chalk";
import { Command } from "commander";

export const myCommand = new Command("mycommand")
  .description("Description of what this command does")
  .option("--json", "Output as JSON for scripting")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (options: { json?: boolean; verbose?: boolean }) => {
    try {
      await executeMyCommand(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.json) {
        console.log(JSON.stringify({ error: message }, null, 2));
      } else {
        console.error(chalk.red(`Error: ${message}`));
      }
      process.exit(1);
    }
  });

async function executeMyCommand(options: { json?: boolean; verbose?: boolean }): Promise<void> {
  // Implementation here
  if (options.json) {
    console.log(JSON.stringify({ result: "success" }, null, 2));
  } else {
    console.log(chalk.green("Command executed successfully"));
  }
}
```

### Step 2: Register Command

Add the command to `tooling/cli/src/index.ts`:

```typescript
import { myCommand } from "./commands/mycommand.js";

// ... existing code ...

program.addCommand(myCommand);
```

### Step 3: Test the Command

```bash
pnpm mt mycommand
pnpm mt mycommand --json
pnpm mt mycommand --help
```

## Patterns and Best Practices

### Error Handling

Always wrap command actions in try/catch and provide both human-readable and JSON error output:

```typescript
.action(async (options: { json?: boolean }) => {
  try {
    await doWork();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ error: message }, null, 2));
    } else {
      console.error(chalk.red(`Error: ${message}`));
    }
    process.exit(1);
  }
});
```

### JSON Output Support

Always support `--json` for scriptability:

```typescript
if (jsonOutput) {
  console.log(JSON.stringify(data, null, 2));
} else {
  // Human-readable formatted output
}
```

### Color Coding

Use consistent color semantics:

```typescript
chalk.green("success", "enabled", "ON", "true")
chalk.yellow("warning", "partial", "PARTIAL")
chalk.red("error", "disabled", "OFF", "false")
chalk.cyan("info", "titles", "string values")
chalk.bold("headers", "emphasis")
```

### Table Output

Use cli-table3 for structured data:

```typescript
import Table from "cli-table3";

const table = new Table({
  head: [chalk.bold("Column1"), chalk.bold("Column2")],
  style: { head: [], border: [] },
});

table.push(["value1", "value2"]);
console.log(table.toString());
```

### Environment Variables

Access environment variables loaded by dotenv-cli:

```typescript
const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (!apiKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_POSTHOG_KEY in environment.\n" +
    "Add it to apps/web/.env.local to use this command."
  );
}
```

## Configuration

### Package Scripts

The CLI uses dotenv-cli to load environment variables before execution:

```json
{
  "scripts": {
    "mt": "dotenv -c -e ../../apps/web/.env.local -e ../../apps/web/.env -- tsx ./src/index.ts"
  }
}
```

This loads variables from:

1. `apps/web/.env.local` (local overrides, not committed)
2. `apps/web/.env` (defaults, committed)

### TypeScript Configuration

The CLI extends the base tsconfig:

```json
{
  "extends": "@repo/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

## Troubleshooting

### "Missing NEXT_PUBLIC_POSTHOG_KEY in environment"

Ensure `apps/web/.env.local` contains the PostHog API key:

```bash
# Check if the key exists
grep NEXT_PUBLIC_POSTHOG_KEY apps/web/.env.local
```

### Command Not Found

Ensure you're running from the repository root:

```bash
cd /path/to/software-multi-tool
pnpm mt features
```

### TypeScript Errors

The CLI uses tsx for direct TypeScript execution. If you encounter issues:

```bash
# Reinstall dependencies
pnpm install

# Check for type errors
pnpm exec tsc --noEmit -p tooling/cli/tsconfig.json
```

## Related Skills

- **analytics**: PostHog integration and feature flag concepts
- **feature-flags**: Feature flag implementation patterns
- **architecture**: Overall monorepo structure
