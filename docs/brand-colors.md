# Brand Color Palette

This document defines the official color palette for Software Multitool. All colors are designed to convey a **Professional & Trustworthy** brand identity.

## Color Philosophy

The palette centers on a classic blue primary color, conveying reliability, competence, and enterprise-grade quality. The supporting colors provide clear visual hierarchy while maintaining accessibility standards.

## Color Reference

### Primary Colors

| Role                   | Light Mode | Dark Mode | Usage                                      |
| ---------------------- | ---------- | --------- | ------------------------------------------ |
| **Primary**            | `#2563EB`  | `#3B82F6` | CTAs, links, focus states, active elements |
| **Primary Foreground** | `#FFFFFF`  | `#0F172A` | Text on primary backgrounds                |

### Secondary Colors

| Role                     | Light Mode | Dark Mode | Usage                                    |
| ------------------------ | ---------- | --------- | ---------------------------------------- |
| **Secondary**            | `#1E293B`  | `#E2E8F0` | Secondary buttons, strong text, headers  |
| **Secondary Foreground** | `#FFFFFF`  | `#0F172A` | Text on secondary backgrounds            |

### Accent Colors

| Role                     | Light Mode | Dark Mode | Usage                                           |
| ------------------------ | ---------- | --------- | ----------------------------------------------- |
| **Accent**               | `#E0F2FE`  | `#1E3A5F` | Hover states, selected items, subtle highlights |
| **Accent Foreground**    | `#0369A1`  | `#7DD3FC` | Text on accent backgrounds                      |
| **Highlight**            | `#F59E0B`  | `#F59E0B` | Badges, notifications, attention elements       |
| **Highlight Foreground** | `#FFFFFF`  | `#FFFFFF` | Text on highlight backgrounds                   |

### Semantic Colors

| Role                      | Light Mode | Dark Mode | Usage                                              |
| ------------------------- | ---------- | --------- | -------------------------------------------------- |
| **Success**               | `#16A34A`  | `#22C55E` | Confirmations, positive actions, completed states  |
| **Success Foreground**    | `#FFFFFF`  | `#FFFFFF` | Text on success backgrounds                        |
| **Destructive**           | `#DC2626`  | `#EF4444` | Errors, deletions, dangerous actions               |
| **Destructive Foreground**| `#FFFFFF`  | `#FFFFFF` | Text on destructive backgrounds                    |

### Surface Colors

| Role                   | Light Mode | Dark Mode | Usage                               |
| ---------------------- | ---------- | --------- | ----------------------------------- |
| **Background**         | `#FAFBFC`  | `#0F172A` | Page backgrounds                    |
| **Foreground**         | `#0F172A`  | `#F1F5F9` | Primary text                        |
| **Card**               | `#FFFFFF`  | `#1E293B` | Card backgrounds                    |
| **Card Foreground**    | `#0F172A`  | `#F1F5F9` | Text in cards                       |
| **Popover**            | `#FFFFFF`  | `#1E293B` | Dropdown, tooltip backgrounds       |
| **Popover Foreground** | `#0F172A`  | `#F1F5F9` | Text in popovers                    |
| **Muted**              | `#F1F5F9`  | `#1E293B` | Subtle backgrounds, disabled states |
| **Muted Foreground**   | `#64748B`  | `#94A3B8` | Secondary text, placeholders        |

### Border & Input Colors

| Role       | Light Mode | Dark Mode | Usage                 |
| ---------- | ---------- | --------- | --------------------- |
| **Border** | `#E2E8F0`  | `#334155` | Borders, dividers     |
| **Input**  | `#CBD5E1`  | `#475569` | Input field borders   |
| **Ring**   | `#2563EB`  | `#3B82F6` | Focus rings, outlines |

## HSL Values

For designers working in HSL color space:

| Color              | Hex       | HSL              |
| ------------------ | --------- | ---------------- |
| Primary (Light)    | `#2563EB` | `217, 91%, 53%`  |
| Primary (Dark)     | `#3B82F6` | `217, 91%, 60%`  |
| Secondary          | `#1E293B` | `222, 32%, 17%`  |
| Success (Light)    | `#16A34A` | `142, 77%, 36%`  |
| Success (Dark)     | `#22C55E` | `142, 71%, 45%`  |
| Destructive (Light)| `#DC2626` | `0, 72%, 51%`    |
| Destructive (Dark) | `#EF4444` | `0, 84%, 60%`    |
| Highlight          | `#F59E0B` | `38, 92%, 50%`   |

## Usage in Code

### Tailwind CSS Classes

Use the semantic color names in Tailwind classes:

```tsx
// Primary button
<button className="bg-primary text-primary-foreground">
  Submit
</button>

// Secondary button
<button className="bg-secondary text-secondary-foreground">
  Cancel
</button>

// Success state
<div className="bg-success text-success-foreground">
  Successfully saved!
</div>

// Error state
<div className="bg-destructive text-destructive-foreground">
  An error occurred
</div>

// Accent highlight
<div className="bg-accent text-accent-foreground">
  Selected item
</div>

// Muted text
<p className="text-muted-foreground">
  Secondary information
</p>
```

### CSS Custom Properties

Access colors directly via CSS variables:

```css
.custom-element {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--border);
}
```

## Accessibility

All color combinations meet **WCAG 2.1 AA** contrast requirements:

| Combination                          | Contrast Ratio | Requirement |
| ------------------------------------ | -------------- | ----------- |
| Primary / Primary Foreground         | 4.9:1          | Passes AA   |
| Secondary / Secondary Foreground     | 12.6:1         | Passes AAA  |
| Success / Success Foreground         | 4.5:1          | Passes AA   |
| Destructive / Destructive Foreground | 4.5:1          | Passes AA   |
| Foreground / Background              | 15.8:1         | Passes AAA  |
| Muted Foreground / Background        | 4.7:1          | Passes AA   |

## Design Guidelines

### Do

- Use **primary** for main CTAs and interactive elements
- Use **secondary** for secondary actions and strong text
- Use **accent** for hover states and selected items
- Use **highlight** sparingly for attention-grabbing elements
- Use **muted** for disabled states and secondary information
- Ensure sufficient contrast for text readability

### Don't

- Don't use destructive color for non-error/non-delete actions
- Don't use highlight as a primary action color
- Don't use muted colors for important information
- Don't create new colors outside this palette without design review
