---
name: configuring-tools
description: Configures tool registry, credit costs, access control (public/private), tool registration, icon selection, credit pack system, and middleware routing.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Tools/Sub-Apps Skill

This skill provides comprehensive guidance for working with the multi-app tools architecture in this project. The system allows for multiple independent sub-apps (utilities) that share common infrastructure.

## When to Use This Skill

Invoke this skill when:

- Registering a new tool in the tool registry
- Configuring tool credit costs and credit units
- Setting up public vs private tool access control
- Selecting icons for tools (Lucide icons)
- Managing tool listings and navigation
- Understanding the credit pack system
- Configuring middleware routing for public tools
- Working with the tool registry configuration

**Activation keywords**: tool registry, register tool, credit costs, public tools, private tools, tool access, credit packs, tool configuration

## Quick Reference

| Component                  | Location                                                 |
| -------------------------- | -------------------------------------------------------- |
| Tool Registry Config       | `config/index.ts` (tools.registry)                       |
| Tool Type Definition       | `config/types.ts` (ToolConfig)                           |
| Tools Route Layout         | `apps/web/app/(saas)/app/tools/layout.tsx`               |
| Tools Listing Page         | `apps/web/app/(saas)/app/tools/page.tsx`                 |
| Dynamic Tool Route         | `apps/web/app/(saas)/app/tools/[toolSlug]/page.tsx`      |
| ToolsNavBar Component      | `apps/web/modules/saas/tools/components/ToolsNavBar.tsx` |
| ToolCard Component         | `apps/web/modules/saas/tools/components/ToolCard.tsx`    |
| Middleware (public access) | `apps/web/middleware.ts`                                 |

## Architecture Overview

### Tool Registry

Tools are defined in `config/index.ts`:

```typescript
tools: {
  registry: [
    {
      slug: "bg-remover",
      name: "Background Remover",
      description: "Remove backgrounds from images with AI",
      icon: "image-minus",
      public: true,
      enabled: true,
    },
    // ... more tools
  ],
}
```

### ToolConfig Interface

```typescript
interface ToolConfig {
  slug: string;           // URL-safe identifier (e.g., "bg-remover")
  name: string;           // Display name (e.g., "Background Remover")
  description: string;    // Short description for cards/metadata
  icon: string;           // Lucide icon name (e.g., "image-minus")
  public: boolean;        // Whether accessible without authentication
  enabled: boolean;       // Whether currently active
  creditCost: number;     // Credits consumed per use
  creditUnit?: CreditUnit; // Unit for variable-cost tools ("request" | "minute" | "page")
}
```

### Route Structure

```text
/app/tools                    # Tool listing page
/app/tools/[toolSlug]         # Individual tool page
/app/tools/bg-remover         # Example: Background Remover
/app/tools/diarization        # Example: Speaker Diarization
```

## Adding a New Tool

### Step 1: Register the Tool

Add the tool to `config/index.ts`:

```typescript
tools: {
  registry: [
    // ... existing tools
    {
      slug: "my-new-tool",
      name: "My New Tool",
      description: "What this tool does",
      icon: "wrench",  // See lucide-react icons
      public: true,    // Set to false if auth required
      enabled: true,
    },
  ],
}
```

### Step 2: Create Tool-Specific Page (Optional)

For custom tool UI, create a dedicated page:

```text
apps/web/app/(saas)/app/tools/[toolSlug]/my-tool/page.tsx
```

Or implement the tool's UI directly in the dynamic route by checking the slug.

### Step 3: Add Tool Icon

Update `apps/web/modules/saas/tools/components/ToolCard.tsx`:

```typescript
import { MyNewToolIcon } from "lucide-react";

function getToolIcon(iconName: string) {
  const icons = {
    // ... existing icons
    "my-new-tool": MyNewToolIcon,
  };
  return icons[iconName] || WrenchIcon;
}
```

## Public vs Private Tools

### Public Tools (`public: true`)

- Accessible without authentication
- Users can try the tool immediately
- Great for growth and user acquisition
- Authenticated users get enhanced features (history, more usage)

### Private Tools (`public: false`)

- Require user authentication
- Full feature access from the start
- Better for premium or sensitive tools

### Middleware Configuration

The middleware in `apps/web/middleware.ts` handles public access:

```typescript
function isPublicToolRoute(pathname: string): boolean {
  if (!pathname.startsWith("/app/tools")) return false;
  if (pathname === "/app/tools") return true;  // Listing always public

  const toolSlug = pathname.split("/app/tools/")[1]?.split("/")[0];
  const tool = appConfig.tools.registry.find(
    (t) => t.slug === toolSlug && t.enabled
  );
  return tool?.public ?? false;
}
```

## Shared User Context

When a user is authenticated, tools can access:

```typescript
import { useSession } from "@saas/auth/hooks/use-session";

function MyTool() {
  const { user } = useSession();

  // user may be null for public tools (unauthenticated access)
  if (user) {
    // Access user preferences, history, etc.
  }
}
```

## Navigation

### Main App Navigation

The NavBar includes a "Tools" link at `apps/web/modules/saas/shared/components/NavBar.tsx`:

```typescript
{
  label: t("app.menu.tools"),
  href: "/app/tools",
  icon: WrenchIcon,
  isActive: pathname.startsWith("/app/tools"),
}
```

### Tools-Specific Navigation

The `ToolsNavBar` component provides:

- Quick access to all enabled tools
- Link back to main dashboard
- User menu (when authenticated)
- Sign in link (when unauthenticated)

## Icon System

Tools use Lucide React icons. Common tool icons:

| Icon Name     | Use Case                      |
| ------------- | ----------------------------- |
| `image-minus` | Image processing (bg removal) |
| `users`       | Multi-user/voice analysis     |
| `newspaper`   | News/content analysis         |
| `wand-2`      | AI/magic operations           |
| `file-text`   | Document processing           |
| `mic`         | Audio processing              |
| `video`       | Video processing              |
| `globe`       | Web/translation tools         |

## Translation Keys

Add tool-related translations to `packages/i18n/translations/`:

```json
{
  "app": {
    "menu": {
      "tools": "Tools"
    }
  }
}
```

## Best Practices

1. **Slug Naming**: Use lowercase, hyphenated slugs (e.g., `bg-remover`, `news-analyzer`)
2. **Description Length**: Keep descriptions under 100 characters for card display
3. **Icon Selection**: Choose icons that clearly represent the tool's function
4. **Public by Default**: Consider making tools public for growth, with enhanced features for authenticated users
5. **Lazy Loading**: Implement heavy tool logic with dynamic imports

## Example: Complete Tool Implementation

```typescript
// 1. Add to config/index.ts
{
  slug: "pdf-converter",
  name: "PDF Converter",
  description: "Convert documents to and from PDF format",
  icon: "file-text",
  public: true,
  enabled: true,
}

// 2. Create custom page (optional)
// apps/web/app/(saas)/app/tools/pdf-converter/page.tsx
export default function PdfConverterPage() {
  return (
    <div className="container max-w-4xl px-4 py-8">
      {/* Tool-specific UI */}
    </div>
  );
}
```

## Related Skills

- **sub-app**: Complete tool implementation (backend, database, frontend)
- **architecture**: Overall codebase structure and routing
- **better-auth**: User authentication for private tools
- **analytics**: Event tracking for tool usage
- **iconography**: Icon component and Lucide icon usage
- **feature-flags**: Feature gating for tools
- **storage**: File upload patterns for tools
- **debugging**: Troubleshooting tool issues

## Credit System

Tools consume credits when used. The credit system uses a **credit pack model** (no overage billing).

### Design Decision: Credit Packs Only

We chose credit packs over overage billing because:

- **Predictable costs**: Users never get surprise bills
- **Clear value proposition**: Credit packs have tangible value
- **Industry standard**: Common pattern in AI tools (Midjourney, stock photos, etc.)
- **Simpler UX**: No complex billing explanations needed

### How It Works

1. **Plans include credits**: Each subscription plan includes a set number of credits per billing period
2. **Tools consume credits**: Each tool use deducts credits based on `creditCost`
3. **Credit packs for more**: When credits run out, users purchase additional credit packs
4. **No automatic charges**: Service pauses when credits are exhausted (no overage)

### Credit Costs by Tool

| Tool                 | Credits | Unit         |
| -------------------- | ------- | ------------ |
| Background Remover   | 1       | per image    |
| Speaker Diarization  | 2       | per minute   |
| News Analyzer        | 1       | per article  |
| Invoice Processor    | 3       | per document |
| Contract Analyzer    | 5       | per page     |
| Feedback Analyzer    | 1       | per analysis |
| Expense Categorizer  | 1       | per expense  |
| Meeting Summarizer   | 2       | per summary  |

### Helper Functions

```typescript
import { getPlanCredits, getToolCreditCost } from "@repo/config";

// Get credits included in a plan
const proCredits = getPlanCredits("pro"); // { included: 500 }

// Get credit cost for a tool
const cost = getToolCreditCost("bg-remover"); // 1
```

### Adding Credit Cost to New Tools

When adding a new tool, always specify `creditCost`:

```typescript
{
  slug: "my-new-tool",
  name: "My New Tool",
  description: "What this tool does",
  icon: "wrench",
  public: true,
  enabled: true,
  creditCost: 2,  // Required: credits per use
  creditUnit: "page",  // Optional: for variable-cost tools
}
```

## Future Considerations

These features are planned but not yet implemented:

- Rate limiting infrastructure
- Async job queue for long-running operations
- Plan-based access control (restrict tools by plan tier)
