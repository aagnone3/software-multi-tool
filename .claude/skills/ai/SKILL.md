---
name: integrating-ai
description: AI/LLM integration using Claude (Anthropic SDK) and OpenAI for document analysis, streaming chat, and text generation with model selection (Haiku/Sonnet/Opus), AI processors, and token optimization. Use when implementing AI features, adding processors, selecting models, or debugging AI integration.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# AI/LLM Skill

## When to Use This Skill

Invoke this skill when:

- Implementing AI-powered features or processors
- Adding new AI processors for document analysis
- Configuring Anthropic or OpenAI API keys
- Selecting appropriate models for use cases
- Debugging AI API calls or response parsing
- Understanding model pricing and token limits
- Implementing streaming AI responses
- Working with the chat system
- Troubleshooting AI integration issues

**Activation keywords**: AI, LLM, Claude, Anthropic, OpenAI, processor, model selection, streaming, executePrompt, agent-sdk

## Quick Reference

| Resource | Location |
| -------- | -------- |
| Anthropic SDK package | `packages/agent-sdk/` |
| OpenAI/Vercel AI package | `packages/ai/` |
| AI processors | `packages/api/modules/*/lib/processor.ts` |
| Chat system | `packages/api/modules/ai/` |
| Chat frontend | `apps/web/modules/saas/ai/components/AiChat.tsx` |
| Environment variables | `apps/web/.env.local` |

## Environment Variables

```bash
# Required for Claude processors
ANTHROPIC_API_KEY=""

# Required for chat, images, audio
OPENAI_API_KEY=""
```

## Provider Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         AI Layer                                │
├────────────────────────────┬────────────────────────────────────┤
│    @repo/agent-sdk         │           @repo/ai                 │
│    (Anthropic/Claude)      │      (OpenAI + Vercel AI SDK)      │
├────────────────────────────┼────────────────────────────────────┤
│ • executePrompt()          │ • textModel (gpt-4o-mini)          │
│ • CLAUDE_MODELS            │ • imageModel (dall-e-3)            │
│ • MODEL_RECOMMENDATIONS    │ • audioModel (whisper-1)           │
│ • createAnthropicClient()  │ • streamText(), generateText()     │
├────────────────────────────┼────────────────────────────────────┤
│ Used by: AI Processors     │ Used by: Chat system               │
│ (7 document processors)    │ (real-time streaming)              │
└────────────────────────────┴────────────────────────────────────┘
```

## @repo/agent-sdk Package

The primary package for Claude/Anthropic integration.

### Exports

```typescript
import {
  executePrompt,           // Main function to call Claude
  createAnthropicClient,   // Create new client instance
  getAnthropicClient,      // Get singleton client
  CLAUDE_MODELS,           // Available model constants
  DEFAULT_MODEL,           // Default model (Haiku 4.5, via HAIKU_3_5 constant)
  MODEL_RECOMMENDATIONS,   // Model recommendations by use case
  AgentSession,            // Multi-turn conversational sessions
  listSkills,              // List available skill documentation
  readSkillDocs,           // Read skill documentation
} from "@repo/agent-sdk";
```

### executePrompt()

The core function for calling Claude:

```typescript
interface PromptOptions {
  model?: string;        // Model to use (defaults to DEFAULT_MODEL)
  maxTokens?: number;    // Max response tokens (default: 1024)
  system?: string;       // System prompt
  temperature?: number;  // Randomness 0-1 (default: 1)
  client?: Anthropic;    // Custom client instance
}

interface PromptResult {
  content: string;       // Generated text
  model: string;         // Model used
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: string | null;
}
```

### Available Models

> **Note**: `CLAUDE_MODELS` constants in the codebase may reference older model IDs. For new processors, prefer the latest Claude 4.x models. Check `packages/agent-sdk/src/` for current constants and update when adding new processors.

```typescript
const CLAUDE_MODELS = {
  HAIKU_3_5: "claude-haiku-4-5-20251001",      // Fast, cost-effective (Haiku 4.5)
  SONNET_3: "claude-3-sonnet-20240229",         // Legacy
  SONNET_3_5_V1: "claude-3-5-sonnet-20240620", // Legacy
  SONNET_3_5_V2: "claude-3-5-sonnet-20241022", // Legacy — prefer Sonnet 4.x
  OPUS_3: "claude-3-opus-20240229",            // Legacy — prefer Opus 4.x
};

const MODEL_RECOMMENDATIONS = {
  structured: CLAUDE_MODELS.HAIKU_3_5,   // JSON, classification
  analysis: CLAUDE_MODELS.SONNET_3_5_V2, // Complex reasoning (update to Sonnet 4.x for new work)
  creative: CLAUDE_MODELS.OPUS_3,        // Creative writing (update to Opus 4.x for new work)
};
```

**Current Claude model IDs for new development:**

| Tier | Model ID | Use Case |
| ---- | -------- | -------- |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast structured extraction |
| Sonnet 4.6 | `claude-sonnet-4-6` | Balanced analysis |
| Opus 4.6 | `claude-opus-4-6` | Complex/creative tasks |

## @repo/ai Package

Package for OpenAI models and Vercel AI SDK.

### Package Exports

```typescript
import {
  textModel,    // OpenAI gpt-4o-mini
  imageModel,   // OpenAI dall-e-3
  audioModel,   // OpenAI whisper-1
} from "@repo/ai";

// Re-exports all from Vercel AI SDK
import { streamText, generateText } from "@repo/ai";

// React hooks
import { useChat } from "@repo/ai/client";
```

## Model Selection Guide

Use `MODEL_RECOMMENDATIONS` from `@repo/agent-sdk` — it maps capability tiers to the codebase's configured model IDs. For new processors, use the latest Claude 4.x model IDs (see table above).

| Capability Tier | Speed | Cost | Temperature | Best For |
| --------------- | ----- | ---- | ----------- | -------- |
| **Haiku** (fast) | Fast | Low | 0.1 | Structured extraction, JSON, classification |
| **Sonnet** (balanced) | Medium | Medium | 0.2-0.3 | Complex analysis, reasoning, summarization |
| **Opus** (most capable) | Slow | High | 0.5-1.0 | Creative writing, nuanced tasks |

### Temperature Guidelines

- `0.1` - Precise, consistent (structured data extraction)
- `0.2-0.3` - Balanced (analysis tasks)
- `0.5-0.7` - Creative but controlled
- `1.0` - Maximum creativity (default)

### Max Tokens Guidelines

- `1024` - Simple responses (default)
- `4096` - Detailed structured output
- `8192` - Long-form analysis

## Existing AI Processors

Seven AI-powered processors using Claude via `executePrompt()`:

| Processor | Model | Purpose | Location |
| --------- | ----- | ------- | -------- |
| Invoice Processor | Haiku | Extract invoice data | `packages/api/modules/invoice-processor/` |
| Expense Categorizer | Haiku | Categorize expenses for taxes | `packages/api/modules/expense-categorizer/` |
| Diarization | Haiku | Speaker diarization | `packages/api/modules/diarization/` |
| News Analyzer | Haiku | Bias/sentiment analysis | `packages/api/modules/news-analyzer/` |
| Meeting Summarizer | Sonnet | Summarize meetings | `packages/api/modules/meeting-summarizer/` |
| Feedback Analyzer | Sonnet | Customer feedback analysis | `packages/api/modules/feedback-analyzer/` |
| Contract Analyzer | Sonnet | Legal analysis, risk identification | `packages/api/modules/contract-analyzer/` |

## Creating a New AI Processor

### Step 1: Choose the Right Model

Use `MODEL_RECOMMENDATIONS` for the codebase defaults, or specify a Claude 4.x model ID directly for new processors:

```typescript
import { MODEL_RECOMMENDATIONS, CLAUDE_MODELS } from "@repo/agent-sdk";

// For structured extraction (invoices, forms) — Haiku tier
const model = MODEL_RECOMMENDATIONS.structured;        // codebase default
const model = "claude-haiku-4-5-20251001";            // explicit current ID

// For complex analysis (contracts, feedback) — Sonnet tier
const model = MODEL_RECOMMENDATIONS.analysis;          // codebase default (older)
const model = "claude-sonnet-4-6";                    // explicit current ID

// For creative tasks — Opus tier
const model = MODEL_RECOMMENDATIONS.creative;          // codebase default (older)
const model = "claude-opus-4-6";                      // explicit current ID
```

### Step 2: Define Your Prompt

```typescript
const EXTRACTION_PROMPT = `You are an expert [domain] extraction system.

IMPORTANT: Return ONLY valid JSON with no additional text.

{
  "field1": "string (required)",
  "field2": "number or null"
}

Guidelines:
- Specific instructions for your use case
- Format requirements
- Handling missing data

Input to process:
`;
```

### Step 3: Call executePrompt

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

const result = await executePrompt(
  `${EXTRACTION_PROMPT}\n\n${inputText}`,
  {
    model: CLAUDE_MODELS.HAIKU_3_5, // claude-haiku-4-5-20251001
    maxTokens: 4096,
    temperature: 0.1,
    system: "You are a precise extraction assistant. Output only valid JSON.",
  }
);

const output = JSON.parse(result.content);
```

### Step 4: Handle Errors

```typescript
try {
  const result = await executePrompt(prompt, options);
  const output = JSON.parse(result.content);
  return { success: true, output };
} catch (error) {
  const errorMessage = error instanceof Error
    ? error.message
    : "Failed to process";
  return { success: false, error: errorMessage };
}
```

## Chat System

The chat system uses OpenAI's gpt-4o-mini with Vercel AI SDK streaming.

### Backend (packages/api/modules/ai/)

```typescript
import { textModel, streamText } from "@repo/ai";

const result = streamText({
  model: textModel,
  messages: chatMessages,
  system: "You are a helpful assistant.",
});

return result.toUIMessageStream();
```

### Frontend (apps/web/modules/saas/ai/)

```typescript
import { useChat } from "@repo/ai/client";

const { messages, input, handleSubmit, isLoading } = useChat({
  api: "/api/ai/chat",
  id: chatId,
});
```

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"

Set the environment variable in `apps/web/.env.local`:

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

### 404 not_found_error for model

Your API key tier may not have access to the requested model. Use a model available to your tier:

```typescript
// Instead of Sonnet/Opus, try:
model: CLAUDE_MODELS.HAIKU_3_5
```

### JSON parsing errors

Ensure your prompt explicitly requests JSON-only output:

```typescript
{
  system: "Output only valid JSON. No explanations or markdown.",
  temperature: 0.1,  // Lower temperature for consistency
}
```

### Rate limiting

The news analyzer includes rate limit detection. For high-volume use:

```typescript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

## Related Skills

- **architecture**: Overall codebase structure and module organization (includes Inngest background jobs)
- **tools**: Adding new tool modules that use AI processors
- **feature-flags**: A/B testing AI features and gradual rollouts
- **storage**: Storing AI-generated content and uploaded files for processing

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
