# Tools Skill Examples

## Example 1: Adding a New Public Tool

```typescript
// 1. Add to config/index.ts tools.registry array:
{
  slug: "text-summarizer",
  name: "Text Summarizer",
  description: "Summarize long text using AI",
  icon: "file-text",
  public: true,
  enabled: true,
}

// 2. Update ToolCard.tsx icon map:
import { FileTextIcon } from "lucide-react";

const icons = {
  // ... existing
  "file-text": FileTextIcon,
};

// 3. The tool is now available at /app/tools/text-summarizer
```

## Example 2: Creating a Custom Tool Page

```typescript
// apps/web/app/(saas)/app/tools/text-summarizer/page.tsx
"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import { useState } from "react";

export default function TextSummarizerPage() {
  const { user } = useSession();
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      // API call to summarize text
      const response = await fetch("/api/tools/summarize", {
        method: "POST",
        body: JSON.stringify({ text: input }),
      });
      const data = await response.json();
      setSummary(data.summary);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-8">
      <div className="rounded-2xl border bg-card p-8">
        <h1 className="text-2xl font-bold">Text Summarizer</h1>
        <p className="mt-2 text-muted-foreground">
          Paste your text below to generate a summary.
        </p>

        <div className="mt-6 space-y-4">
          <Textarea
            placeholder="Paste your text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
          />

          <Button onClick={handleSummarize} disabled={isLoading || !input}>
            {isLoading ? "Summarizing..." : "Summarize"}
          </Button>

          {summary && (
            <div className="mt-6 rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold">Summary</h3>
              <p className="mt-2">{summary}</p>
            </div>
          )}

          {!user && (
            <p className="text-sm text-muted-foreground">
              Sign in to save your summaries and access more features.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Example 3: Adding a Private Tool

```typescript
// 1. Add to config/index.ts with public: false
{
  slug: "api-tester",
  name: "API Tester",
  description: "Test and debug API endpoints",
  icon: "terminal",
  public: false,  // Requires authentication
  enabled: true,
}

// 2. The middleware will automatically redirect unauthenticated users
// to /auth/login?redirectTo=/app/tools/api-tester
```

## Example 4: Disabling a Tool Temporarily

```typescript
// Set enabled: false to hide from listing without removing
{
  slug: "beta-feature",
  name: "Beta Feature",
  description: "Coming soon!",
  icon: "flask",
  public: true,
  enabled: false,  // Won't appear in tools listing
}
```

## Example 5: Tool with User Session Integration

```typescript
"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useAnalytics } from "@analytics";

export default function MyToolPage() {
  const { user } = useSession();
  const { trackEvent } = useAnalytics();

  const handleToolAction = () => {
    trackEvent("tool_action", {
      tool: "my-tool",
      action: "process",
      user_id: user?.id ?? "anonymous",
    });

    // Perform the action
  };

  return (
    <div>
      {user ? (
        <p>Welcome, {user.name}! You have access to all features.</p>
      ) : (
        <p>You're using the free version. Sign in for more features.</p>
      )}
    </div>
  );
}
```

## Example 6: Tool Card Grid Customization

```typescript
// Modify apps/web/app/(saas)/app/tools/page.tsx for custom layouts

import { config } from "@repo/config";
import { ToolCard } from "@saas/tools/components/ToolCard";

export default function ToolsPage() {
  const enabledTools = config.tools.registry.filter((tool) => tool.enabled);

  // Group tools by category (if you add a category field)
  const aiTools = enabledTools.filter((t) => t.slug.includes("ai"));
  const mediaTools = enabledTools.filter((t) =>
    ["bg-remover", "diarization"].includes(t.slug)
  );

  return (
    <div className="container max-w-6xl px-4 py-8">
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">AI Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {aiTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Media Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mediaTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
```
