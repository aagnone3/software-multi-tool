---
name: using-icons
description: Uses icons in UI components with size selection, semantic color application, and consistent usage patterns. Covers the Icon component, Lucide React integration, and size/color systems.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Using Icons

> Standardized icon system built on Lucide React with consistent sizing and semantic color integration.

## Quick Reference

### Icon Sizes

| Size | Pixels | Tailwind | Use Case                                   |
| ---- | ------ | -------- | ------------------------------------------ |
| xs   | 12px   | size-3   | Inline with small text, badges, chips      |
| sm   | 16px   | size-4   | Default UI controls, buttons, navigation   |
| md   | 20px   | size-5   | Emphasized icons, medium buttons           |
| lg   | 24px   | size-6   | Section headers, prominent actions         |
| xl   | 32px   | size-8   | Feature highlights, empty states           |
| 2xl  | 40px   | size-10  | Hero icons, loading states                 |

### Icon Colors

| Variant     | CSS Class             | Use Case                           |
| ----------- | --------------------- | ---------------------------------- |
| inherit     | (none)                | Inherits from parent (default)     |
| primary     | text-primary          | Brand actions, links, focus states |
| secondary   | text-secondary        | Strong contrast, secondary actions |
| muted       | text-muted-foreground | Subdued icons, placeholder states  |
| success     | text-success          | Confirmations, positive feedback   |
| destructive | text-destructive      | Errors, deletions, warnings        |
| highlight   | text-highlight        | Attention, badges, notifications   |

## When to Use This Skill

Invoke this skill when:

- Adding icons to UI components
- Choosing appropriate icon sizes for different contexts
- Applying semantic colors to icons
- Creating consistent icon usage across the application

**Activation keywords**: icon, icons, iconography, lucide, icon size, icon color

## Architecture Overview

```text
apps/web/modules/ui/components/
└── icon.tsx          # Icon component with size and color system
└── icon.test.tsx     # Comprehensive test coverage
```

### Component Location

```typescript
import { Icon, type IconSize, type IconColor } from "@ui/components/icon";
```

### Lucide Icons

All icons come from [Lucide React](https://lucide.dev/icons/). Import icons directly:

```typescript
import { HomeIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
```

## Usage Examples

### Basic Usage

```tsx
import { Icon } from "@ui/components/icon";
import { HomeIcon } from "lucide-react";

// Default size (sm = 16px), inherits color
<Icon icon={HomeIcon} />

// With explicit size
<Icon icon={HomeIcon} size="md" />

// With semantic color
<Icon icon={CheckIcon} size="lg" color="success" />
```

### In Buttons

Icons in buttons typically inherit the button's text color:

```tsx
<Button>
  <Icon icon={PlusIcon} size="sm" />
  Add Item
</Button>

<Button variant="destructive">
  <Icon icon={TrashIcon} size="sm" />
  Delete
</Button>
```

### Status Indicators

```tsx
// Success state
<Icon icon={CheckCircleIcon} size="md" color="success" />

// Error state
<Icon icon={AlertCircleIcon} size="md" color="destructive" />

// Warning/attention
<Icon icon={AlertTriangleIcon} size="md" color="highlight" />
```

### Navigation Items

```tsx
<nav className="flex gap-4">
  <a href="/" className="flex items-center gap-2">
    <Icon icon={HomeIcon} size="sm" />
    Home
  </a>
  <a href="/settings" className="flex items-center gap-2">
    <Icon icon={SettingsIcon} size="sm" />
    Settings
  </a>
</nav>
```

### Empty States

```tsx
<div className="text-center py-12">
  <Icon icon={InboxIcon} size="2xl" color="muted" className="mx-auto mb-4" />
  <h3 className="text-lg font-medium">No messages</h3>
  <p className="text-muted-foreground">Your inbox is empty</p>
</div>
```

### Custom Styling

The Icon component accepts a `className` prop for additional styling:

```tsx
// Override size via className (Tailwind merge handles conflicts)
<Icon icon={HomeIcon} size="sm" className="size-12" />

// Add margins or other styles
<Icon icon={ArrowRightIcon} size="md" className="ml-2" />

// Custom stroke width
<Icon icon={HeartIcon} size="lg" strokeWidth={1.5} />
```

## Size Selection Guide

### xs (12px)

- Inline with small/caption text
- Badge indicators
- Chip icons
- Tight UI elements

### sm (16px) - Default

- Buttons
- Form inputs
- Navigation items
- List item icons
- Table actions

### md (20px)

- Emphasized buttons
- Card headers
- Toolbar icons
- Medium prominence

### lg (24px)

- Section headers
- Feature cards
- Prominent call-to-action
- Dialog headers

### xl (32px)

- Feature highlights
- Empty state illustrations
- Onboarding steps
- Marketing sections

### 2xl (40px)

- Hero sections
- Loading spinners
- Full-page empty states
- Marketing hero icons

## Accessibility

The Icon component automatically:

- Sets `aria-hidden="true"` (icons are decorative by default)
- Applies `shrink-0` to prevent icon squishing in flex layouts

For icons that convey meaning without accompanying text, override with `aria-label`:

```tsx
<Icon
  icon={CloseIcon}
  size="sm"
  aria-hidden={false}
  aria-label="Close dialog"
/>
```

## Type Guards

For runtime validation of icon sizes and colors:

```typescript
import { isIconSize, isIconColor } from "@ui/components/icon";

// Validate dynamic values
if (isIconSize(userInput)) {
  // userInput is typed as IconSize
}

if (isIconColor(colorFromApi)) {
  // colorFromApi is typed as IconColor
}
```

## Programmatic Size Values

For cases where you need pixel values (e.g., canvas rendering, SVG manipulation):

```typescript
import { iconSizeValues } from "@ui/components/icon";

iconSizeValues.xs;   // 12
iconSizeValues.sm;   // 16
iconSizeValues.md;   // 20
iconSizeValues.lg;   // 24
iconSizeValues.xl;   // 32
iconSizeValues["2xl"]; // 40
```

## Integration with Brand Colors

The icon color system integrates with the brand color palette defined in `tooling/tailwind/theme.css`:

| Icon Color  | Brand Color Variable        |
| ----------- | --------------------------- |
| primary     | --primary (#2563EB)         |
| secondary   | --secondary                 |
| muted       | --muted-foreground          |
| success     | --success (#16A34A)         |
| destructive | --destructive (#DC2626)     |
| highlight   | --highlight (#F59E0B)       |

## Related Skills

- **typography**: Font system and text styling
- **architecture**: UI component organization
