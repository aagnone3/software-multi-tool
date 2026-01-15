# AI/LLM Examples

Practical code examples for working with AI features in this codebase.

## Table of Contents

- [Basic Claude Usage](#basic-claude-usage)
- [Structured Data Extraction](#structured-data-extraction)
- [Complex Analysis](#complex-analysis)
- [Chat System](#chat-system)
- [Error Handling](#error-handling)
- [Model Selection](#model-selection)

---

## Basic Claude Usage

### Simple Prompt

```typescript
import { executePrompt } from "@repo/agent-sdk";

const result = await executePrompt("What is the capital of France?");
console.log(result.content); // "The capital of France is Paris."
console.log(result.usage);   // { inputTokens: 8, outputTokens: 12 }
```

### With Options

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

const result = await executePrompt(
  "Explain quantum computing in simple terms",
  {
    model: CLAUDE_MODELS.SONNET_3_5_V2,
    maxTokens: 500,
    temperature: 0.3,
    system: "You are a helpful physics teacher. Use simple analogies.",
  }
);
```

---

## Structured Data Extraction

### Invoice Extraction Pattern

```typescript
import { executePrompt, MODEL_RECOMMENDATIONS } from "@repo/agent-sdk";

const INVOICE_PROMPT = `Extract structured data from this invoice.

Return ONLY valid JSON:
{
  "vendor": { "name": "string", "email": "string or null" },
  "total": "number",
  "currency": "string (ISO code)",
  "lineItems": [{ "description": "string", "amount": "number" }]
}

Invoice:
`;

async function extractInvoice(invoiceText: string) {
  const result = await executePrompt(
    `${INVOICE_PROMPT}\n\n${invoiceText}`,
    {
      model: MODEL_RECOMMENDATIONS.structured, // Haiku
      maxTokens: 4096,
      temperature: 0.1,
      system: "Output only valid JSON. No explanations.",
    }
  );

  return JSON.parse(result.content);
}
```

### Entity Extraction Pattern

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

interface ExtractedEntities {
  people: string[];
  organizations: string[];
  locations: string[];
  dates: string[];
}

async function extractEntities(text: string): Promise<ExtractedEntities> {
  const prompt = `Extract all named entities from this text.

Return JSON:
{
  "people": ["array of person names"],
  "organizations": ["array of organization names"],
  "locations": ["array of location names"],
  "dates": ["array of dates mentioned"]
}

Text: ${text}`;

  const result = await executePrompt(prompt, {
    model: CLAUDE_MODELS.HAIKU_3_5,
    maxTokens: 2048,
    temperature: 0.1,
  });

  return JSON.parse(result.content);
}
```

---

## Complex Analysis

### Sentiment Analysis Pattern

```typescript
import { executePrompt, MODEL_RECOMMENDATIONS } from "@repo/agent-sdk";

interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  keyPhrases: string[];
  summary: string;
}

async function analyzeSentiment(feedback: string): Promise<SentimentResult> {
  const prompt = `Analyze the sentiment of this customer feedback.

Return JSON:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": 0.0-1.0,
  "keyPhrases": ["phrases that indicate sentiment"],
  "summary": "brief explanation"
}

Feedback: ${feedback}`;

  const result = await executePrompt(prompt, {
    model: MODEL_RECOMMENDATIONS.analysis, // Sonnet
    maxTokens: 1024,
    temperature: 0.2,
    system: "You are a sentiment analysis expert. Be precise and objective.",
  });

  return JSON.parse(result.content);
}
```

### Document Summarization Pattern

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

interface MeetingSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: Array<{
    task: string;
    assignee: string | null;
    deadline: string | null;
  }>;
  decisions: string[];
}

async function summarizeMeeting(transcript: string): Promise<MeetingSummary> {
  const prompt = `Summarize this meeting transcript.

Return JSON:
{
  "executiveSummary": "2-3 sentence overview",
  "keyPoints": ["important discussion points"],
  "actionItems": [{ "task": "...", "assignee": "name or null", "deadline": "date or null" }],
  "decisions": ["decisions that were made"]
}

Transcript:
${transcript}`;

  const result = await executePrompt(prompt, {
    model: CLAUDE_MODELS.SONNET_3_5_V2,
    maxTokens: 4096,
    temperature: 0.3,
  });

  return JSON.parse(result.content);
}
```

---

## Chat System

### Backend Streaming Handler

```typescript
import { textModel, streamText } from "@repo/ai";

export async function handleChatMessage(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt?: string
) {
  const result = streamText({
    model: textModel,
    messages,
    system: systemPrompt ?? "You are a helpful assistant.",
  });

  return result.toUIMessageStream();
}
```

### Frontend Chat Component

```typescript
"use client";

import { useChat } from "@repo/ai/client";

export function ChatInterface({ chatId }: { chatId: string }) {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: "/api/ai/chat",
    id: chatId,
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>

      {error && <div className="error">{error.message}</div>}
    </div>
  );
}
```

---

## Error Handling

### Robust Processor Pattern

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

interface ProcessorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

async function processWithRetry<T>(
  prompt: string,
  options: { maxRetries?: number; model?: string } = {}
): Promise<ProcessorResult<T>> {
  const { maxRetries = 2, model = CLAUDE_MODELS.HAIKU_3_5 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await executePrompt(prompt, {
        model,
        maxTokens: 4096,
        temperature: 0.1,
        system: "Output only valid JSON.",
      });

      const data = JSON.parse(result.content) as T;

      return {
        success: true,
        data,
        usage: result.usage,
      };
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // Wait before retry
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return { success: false, error: "Max retries exceeded" };
}
```

### Validation Pattern

```typescript
import { z } from "zod";
import { executePrompt } from "@repo/agent-sdk";

const InvoiceSchema = z.object({
  vendor: z.object({
    name: z.string(),
    email: z.string().email().nullable(),
  }),
  total: z.number().positive(),
  currency: z.string().length(3),
});

async function extractAndValidate(text: string) {
  const result = await executePrompt(`Extract invoice data...\n\n${text}`, {
    model: "claude-3-5-haiku-20241022",
    temperature: 0.1,
  });

  const parsed = JSON.parse(result.content);

  // Validate with Zod
  const validated = InvoiceSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(`Validation failed: ${validated.error.message}`);
  }

  return validated.data;
}
```

---

## Model Selection

### Dynamic Model Selection

```typescript
import { executePrompt, CLAUDE_MODELS, MODEL_RECOMMENDATIONS } from "@repo/agent-sdk";

type TaskType = "extraction" | "analysis" | "creative";

function selectModel(taskType: TaskType, inputLength: number): string {
  // For very short inputs, always use Haiku
  if (inputLength < 500) {
    return CLAUDE_MODELS.HAIKU_3_5;
  }

  switch (taskType) {
    case "extraction":
      return MODEL_RECOMMENDATIONS.structured;
    case "analysis":
      return MODEL_RECOMMENDATIONS.analysis;
    case "creative":
      return MODEL_RECOMMENDATIONS.creative;
    default:
      return CLAUDE_MODELS.HAIKU_3_5;
  }
}

async function processTask(input: string, taskType: TaskType) {
  const model = selectModel(taskType, input.length);

  return executePrompt(input, {
    model,
    maxTokens: taskType === "creative" ? 8192 : 4096,
    temperature: taskType === "creative" ? 0.7 : 0.1,
  });
}
```

### Cost-Conscious Processing

```typescript
import { executePrompt, CLAUDE_MODELS } from "@repo/agent-sdk";

// Start with cheapest model, escalate if needed
async function processWithEscalation(prompt: string) {
  // Try Haiku first
  let result = await executePrompt(prompt, {
    model: CLAUDE_MODELS.HAIKU_3_5,
    maxTokens: 2048,
  });

  // Check if response indicates uncertainty
  if (result.content.includes("I'm not certain") ||
      result.content.includes("unclear")) {
    // Escalate to Sonnet
    result = await executePrompt(prompt, {
      model: CLAUDE_MODELS.SONNET_3_5_V2,
      maxTokens: 4096,
    });
  }

  return result;
}
```

---

## See Also

- [SKILL.md](./SKILL.md) - Main AI skill documentation
- [Invoice Processor](../../../packages/api/modules/invoice-processor/) - Real-world example
- [Feedback Analyzer](../../../packages/api/modules/feedback-analyzer/) - Complex analysis example
