---
name: typography
description: Provides typography configuration guidance covering Next.js font loading, Tailwind font utilities, CSS variables, and email template fonts. Activated when changing fonts, working with font utilities, or updating typography settings.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Typography Skill

This skill provides comprehensive guidance for managing typography across the project, including web fonts, email fonts, Tailwind integration, and the CSS variable system.

## Quick Reference

| Component                | Location                                                  |
| ------------------------ | --------------------------------------------------------- |
| **Primary Font Config**  | `apps/web/modules/shared/components/Document.tsx`         |
| **Tailwind Theme**       | `tooling/tailwind/theme.css`                              |
| **Global CSS**           | `apps/web/app/globals.css`                                |
| **Email Font Config**    | `packages/mail/src/components/Wrapper.tsx`                |
| **Font CSS Variable**    | `--font-sans`                                             |
| **Current Web Font**     | Montserrat (Google Fonts)                                 |
| **Current Email Font**   | Inter (Google Fonts via React Email)                      |

## Architecture Overview

Typography in this project follows a **layered configuration pattern**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Font Loading                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           apps/web/modules/shared/Document.tsx            │   │
│  │   - Loads font from Google Fonts via next/font/google     │   │
│  │   - Sets CSS variable: --font-sans                        │   │
│  │   - Applies font class to <html> element                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Tailwind CSS Integration                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              tooling/tailwind/theme.css                   │   │
│  │   - Maps --font-sans to Tailwind's font-sans utility      │   │
│  │   - Provides system font fallbacks                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Component Usage                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Use Tailwind classes: font-sans, text-lg, font-bold     │   │
│  │   CSS inherits from <html> element by default             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Web Font Configuration

### Primary Font (Document.tsx)

The main application font is configured in `apps/web/modules/shared/components/Document.tsx`:

```typescript
import { Montserrat } from "next/font/google";

const sansFont = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function Document({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning className={sansFont.className}>
      {/* ... */}
    </html>
  );
}
```

**Key Configuration Options:**

| Option     | Purpose                                    | Current Value                  |
| ---------- | ------------------------------------------ | ------------------------------ |
| `weight`   | Font weights to load (reduces bundle size) | `["400", "500", "600", "700"]` |
| `subsets`  | Character sets to include                  | `["latin"]`                    |
| `variable` | CSS custom property name                   | `"--font-sans"`                |

### Tailwind Theme Integration

The CSS variable is mapped to Tailwind in `tooling/tailwind/theme.css`:

```css
@theme {
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  /* ... other theme variables */
}
```

This provides:

- Primary font from the CSS variable
- System font fallbacks for resilience
- Integration with Tailwind's `font-sans` utility class

## Changing the Font

### Step 1: Update Document.tsx

Replace the font import and configuration:

```typescript
// Before
import { Montserrat } from "next/font/google";

const sansFont = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

// After (example: switching to Inter)
import { Inter } from "next/font/google";

const sansFont = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});
```

### Step 2: Verify Weights

Ensure the weights you specify are available for the font. Check Google Fonts for available weights:

- 100 = Thin
- 200 = Extra Light
- 300 = Light
- 400 = Regular
- 500 = Medium
- 600 = Semi Bold
- 700 = Bold
- 800 = Extra Bold
- 900 = Black

### Step 3: Test Rendering

Run the dev server and verify:

- Font loads without console errors
- All weights render correctly
- No Flash of Unstyled Text (FOUT)

```bash
pnpm dev
```

## Available Google Fonts

Popular geometric sans-serif fonts (similar to Anthropic's style):

| Font          | Import Name         | Weights   | Notes                             |
| ------------- | ------------------- | --------- | --------------------------------- |
| Montserrat    | `Montserrat`        | 100-900   | Current default, elegant modern   |
| Space Grotesk | `Space_Grotesk`     | 300-700   | Sharp geometric, futuristic       |
| Inter         | `Inter`             | 100-900   | Highly readable, versatile        |
| DM Sans       | `DM_Sans`           | 400-700   | Clean geometric                   |
| Plus Jakarta  | `Plus_Jakarta_Sans` | 200-800   | Contemporary, Futura-inspired     |
| Albert Sans   | `Albert_Sans`       | 100-900   | Scandinavian-inspired             |
| Geist         | `Geist`             | 100-900   | Vercel design system              |
| Poppins       | `Poppins`           | 100-900   | Geometric, rounded                |

### Using Variable Fonts

For fonts with variable weight support:

```typescript
import { Inter } from "next/font/google";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  // No weight array = variable font (all weights)
});
```

## Email Font Configuration

Email fonts are configured separately in `packages/mail/src/components/Wrapper.tsx`:

```typescript
import { Font } from "@react-email/components";

export default function Wrapper({ children }: PropsWithChildren) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      {/* ... */}
    </Html>
  );
}
```

**Email Font Considerations:**

- Email clients have limited font support
- Always provide a web-safe fallback (`Arial`, `Helvetica`, `Georgia`)
- Google Fonts work in most modern email clients
- Some clients will ignore custom fonts entirely

### Changing Email Font

Update the `fontFamily` prop in `Wrapper.tsx`:

```typescript
<Font
  fontFamily="Montserrat"  // Must match Google Fonts name exactly
  fallbackFontFamily="Arial"
  fontWeight={400}
  fontStyle="normal"
/>
```

## Typography Utilities

### Tailwind Classes

Common typography classes available:

```tsx
// Font family
<p className="font-sans">Uses the configured sans font</p>
<p className="font-mono">Uses monospace font</p>

// Font size
<p className="text-sm">Small text</p>
<p className="text-base">Base size (16px)</p>
<p className="text-lg">Large text</p>
<p className="text-xl">Extra large</p>
<p className="text-2xl">2x large</p>

// Font weight
<p className="font-normal">400 weight</p>
<p className="font-medium">500 weight</p>
<p className="font-semibold">600 weight</p>
<p className="font-bold">700 weight</p>

// Line height
<p className="leading-tight">Tight line height</p>
<p className="leading-normal">Normal line height</p>
<p className="leading-relaxed">Relaxed line height</p>

// Letter spacing
<p className="tracking-tight">Tight tracking</p>
<p className="tracking-normal">Normal tracking</p>
<p className="tracking-wide">Wide tracking</p>
```

### Antialiasing

The app uses font smoothing by default (configured in Document.tsx body):

```tsx
<body className="antialiased">
```

## Font Loading Best Practices

### Optimize Font Loading

1. **Limit weights**: Only load weights you actually use
2. **Use subsets**: Only load character sets needed (`latin`, `latin-ext`, etc.)
3. **Preload critical fonts**: Next.js handles this automatically with `next/font`

### Avoid FOUT (Flash of Unstyled Text)

The `next/font` system automatically:

- Preloads fonts
- Applies `font-display: swap`
- Inlines critical CSS
- Generates optimal font-face rules

### Performance Monitoring

Check font loading performance:

```bash
# In browser DevTools
1. Open Network tab
2. Filter by "Font"
3. Check font file sizes
4. Verify preload hints in HTML <head>
```

## Troubleshooting

### Font Not Loading

1. **Check import name**: Must exactly match `next/font/google` export
2. **Verify weights exist**: Not all fonts have all weights
3. **Check console**: Look for font loading errors
4. **Verify CSS variable**: Inspect `<html>` element for `--font-sans`

### Font Looks Wrong

1. **Check weight**: Ensure the weight you're using is loaded
2. **Check antialiasing**: Verify `antialiased` class is applied
3. **Check fallback**: If font fails, you'll see system font

### Build Errors

```bash
# Error: Font "FontName" not found
# Solution: Check exact import name at fonts.google.com
```

## When to Use This Skill

Invoke this skill when:

- Changing the application font
- Adding additional fonts (e.g., monospace for code)
- Troubleshooting font loading issues
- Understanding the font configuration architecture
- Optimizing font performance
- Updating email typography
- Working with Tailwind typography utilities

## Related Skills

- **architecture**: Overall codebase structure and theming
- **sub-app**: Implementing typography in new tools
- **landing-page-design**: Typography in marketing pages
- **iconography**: Complementary visual design system
- **better-auth**: Email templates with proper typography

## Additional Resources

- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Google Fonts](https://fonts.google.com/)
- [Tailwind Typography](https://tailwindcss.com/docs/font-family)
- [React Email Fonts](https://react.email/docs/components/font)
