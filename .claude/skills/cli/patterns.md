# CLI Development Patterns

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

