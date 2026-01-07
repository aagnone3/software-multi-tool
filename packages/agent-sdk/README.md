# @repo/agent-sdk

Shared Claude Agent SDK integration for the software-multi-tool application. This package provides a framework-agnostic interface for executing prompts with Claude AI and managing skill documentation.

## Features

- **Prompt Execution**: Execute prompts using Claude with a simple, typed API
- **Client Management**: Lazy-initialized Anthropic client with environment-based configuration
- **Skill Documentation**: Upsert and manage Claude Code skill documentation
- **TypeScript Support**: Fully typed interfaces and responses
- **Test Coverage**: Integration tests with Haiku model for CI verification

## Installation

This package is available as a workspace dependency. Import it using the `@repo/agent-sdk` alias:

```typescript
import { executePrompt } from "@repo/agent-sdk";
```

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Required for Claude Agent SDK
ANTHROPIC_API_KEY="your_api_key_here"
```

Get your API key from: https://console.anthropic.com/

### CI/CD Setup

For GitHub Actions, add `ANTHROPIC_API_KEY` to your repository secrets:

1. Go to repository Settings > Secrets and variables > Actions
2. Add new repository secret: `ANTHROPIC_API_KEY`
3. Integration tests will run automatically in CI

## Usage

### Basic Prompt Execution

```typescript
import { executePrompt } from "@repo/agent-sdk";

const result = await executePrompt("What is the capital of France?");
console.log(result.content); // "The capital of France is Paris."
```

### With Options

```typescript
import { executePrompt } from "@repo/agent-sdk";

const result = await executePrompt("Explain quantum computing", {
  model: "claude-3-5-haiku-20241022",
  maxTokens: 500,
  system: "You are a helpful physics teacher.",
  temperature: 0.7,
});

console.log(result.content);
console.log(`Used ${result.usage.inputTokens} input tokens`);
console.log(`Used ${result.usage.outputTokens} output tokens`);
```

### Custom Client

```typescript
import { createAnthropicClient, executePrompt } from "@repo/agent-sdk";

const client = createAnthropicClient();
const result = await executePrompt("Hello!", { client });
```

### Skill Documentation Management

```typescript
import { upsertSkillDocs, readSkillDocs, listSkills } from "@repo/agent-sdk";

// Create or update skill documentation
await upsertSkillDocs({
  name: "user-authentication",
  description: "Handle user authentication workflows",
  content: `# User Authentication

This skill handles user authentication, including login, signup, and password reset flows.

## Usage

Invoke this skill when the user mentions authentication tasks.
`,
});

// Read skill documentation
const content = await readSkillDocs("user-authentication");
console.log(content);

// List all available skills
const skills = await listSkills();
console.log(skills); // ["user-authentication", ...]
```

## API Reference

### `executePrompt(prompt, options?)`

Execute a prompt using Claude Agent SDK.

**Parameters:**

- `prompt: string` - The user prompt/message to send to Claude
- `options?: PromptOptions` - Configuration options (optional)
  - `model?: string` - Model to use (default: `"claude-3-5-sonnet-20241022"`)
  - `maxTokens?: number` - Maximum tokens to generate (default: `1024`)
  - `system?: string` - System prompt for context (optional)
  - `temperature?: number` - Response randomness 0-1 (default: `1`)
  - `client?: Anthropic` - Custom Anthropic client (optional)

**Returns:** `Promise<PromptResult>`

- `content: string` - Generated text content
- `model: string` - Model used for generation
- `usage: { inputTokens: number; outputTokens: number }` - Token usage
- `stopReason: string | null` - Stop reason for generation

### `createAnthropicClient()`

Creates a new Anthropic client instance with API key from environment.

**Throws:** Error if `ANTHROPIC_API_KEY` is not set

**Returns:** `Anthropic` client instance

### `getAnthropicClient()`

Returns the default (lazy-initialized) Anthropic client instance.

**Returns:** `Anthropic` client instance

### `upsertSkillDocs(doc)`

Create or update Claude Code skill documentation.

**Parameters:**

- `doc: SkillDocumentation`
  - `name: string` - Skill name
  - `description: string` - Skill description
  - `content: string` - Full markdown content
  - `skillsDir?: string` - Skills directory (default: `".claude/skills"`)

**Returns:** `Promise<string>` - Path to created/updated SKILL.md file

### `readSkillDocs(skillName, skillsDir?)`

Read skill documentation from the Claude skills directory.

**Parameters:**

- `skillName: string` - Name of the skill to read
- `skillsDir?: string` - Skills directory (default: `".claude/skills"`)

**Returns:** `Promise<string | null>` - Skill content or null if not found

### `listSkills(skillsDir?)`

List all available skills in the Claude skills directory.

**Parameters:**

- `skillsDir?: string` - Skills directory (default: `".claude/skills"`)

**Returns:** `Promise<string[]>` - Array of skill names

## Testing

### Run Tests

```bash
# Run all tests for this package
pnpm --filter @repo/agent-sdk test

# Run with coverage
pnpm --filter @repo/agent-sdk test:ci

# Run type checking
pnpm --filter @repo/agent-sdk type-check
```

### Integration Tests

Integration tests require `ANTHROPIC_API_KEY` to be set. Tests use the Haiku model with minimal prompts to minimize API costs.

**Behavior:**

- **CI environments** (`CI=true`): Tests **fail** if `ANTHROPIC_API_KEY` is not set, ensuring proper configuration
- **Local development**: Tests **skip** if `ANTHROPIC_API_KEY` is not set, for developer convenience
- **Once configured**: Tests run automatically and validate SDK integration

This ensures CI properly validates the SDK integration while allowing local development without requiring an API key.

## Architecture

This package follows the monorepo patterns established in `packages/`:

- **Framework-agnostic**: Can be used in Next.js, Node.js scripts, or any TypeScript context
- **Type-safe**: Full TypeScript support with exported interfaces
- **Workspace alias**: Available via `@repo/agent-sdk` import
- **Shared configuration**: Uses `@repo/tsconfig` and monorepo tooling

## Cost Optimization

When using the SDK in production:

1. **Choose appropriate models**: Use Haiku for simple tasks, Sonnet for complex reasoning
2. **Limit max_tokens**: Set reasonable limits to avoid runaway costs
3. **Cache system prompts**: Reuse system prompts when possible
4. **Monitor usage**: Track `usage.inputTokens` and `usage.outputTokens` in responses

## Examples

### News Analyzer Sub-App

```typescript
import { executePrompt } from "@repo/agent-sdk";

export async function analyzeNews(articleText: string) {
  const result = await executePrompt(
    `Analyze this news article and provide key insights: ${articleText}`,
    {
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 500,
      system: "You are a news analyst. Provide concise, factual insights.",
    }
  );

  return result.content;
}
```

### Speaker Diarization Sub-App

```typescript
import { executePrompt } from "@repo/agent-sdk";

export async function diarizeTranscript(transcript: string) {
  const result = await executePrompt(
    `Identify different speakers in this transcript: ${transcript}`,
    {
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 1000,
      system: "You are an expert at speaker diarization. Label speakers clearly.",
    }
  );

  return result.content;
}
```

## Contributing

When adding new functionality to this package:

1. Follow existing TypeScript patterns
2. Add tests for new features
3. Update this README with usage examples
4. Ensure type safety with exported interfaces
5. Consider API costs when adding integration tests

## License

Part of the software-multi-tool monorepo.
