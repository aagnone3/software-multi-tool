---
name: designing-landing-pages
description: Designs landing pages with animated gradient orbs, floating geometric shapes, dot grid patterns, organic drift animations, CSS keyframe animations, blur effects, and performance optimization. Use when designing hero sections, adding background animations, implementing marketing page visuals, or optimizing animation performance.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebFetch
---

# Landing Page Design Skill

> Create visually compelling landing pages with animated backgrounds, gradient orbs, geometric patterns, and modern design techniques.

## Quick Reference

### Background Pattern Types

| Type | Effect | Use Case |
| ---- | ------ | -------- |
| Gradient Orbs | Soft, blurred color blobs | Hero sections, depth |
| Dot Grid | Subtle repeating dots | Texture, sophistication |
| Grid Pattern | Crisp SVG lines | Structure, technical feel |
| Geometric Shapes | Floating wireframes | Visual interest, movement |
| Particle Systems | Interactive dots/lines | Dynamic, modern feel |
| Aurora/Glow | Flowing color waves | Dreamy, premium feel |
| Noise Texture | Organic grain effect | Depth, tactile quality |

### Animation Patterns

| Pattern | CSS Technique | Duration | Use Case |
| ------- | ------------- | -------- | -------- |
| Drift | Multi-point keyframes | 18-28s | Organic wandering |
| Float | Vertical + rotation | 8-12s | Gentle bobbing |
| Pulse | Scale + opacity | 4-6s | Attention, breathing |
| Fade | Opacity transitions | 3-5s | Subtle presence |

## When to Use This Skill

Use this skill when:

- Designing landing page backgrounds
- Creating animated hero sections
- Implementing decorative visual patterns
- Adding depth and visual interest to marketing pages
- Enhancing page aesthetics without compromising performance

**Activation keywords**: landing page, background, animated background, hero section, gradient orbs, floating shapes, visual design, marketing page

## Architecture Overview

```text
apps/web/modules/marketing/
├── shared/components/
│   └── AnimatedBackground.tsx    # Main animated background component
├── home/components/
│   └── Hero.tsx                  # Landing page hero section
└── ...
```

### Color Integration

Landing page backgrounds should use the theme color palette from `tooling/tailwind/theme.css`:

| Color | Variable | Use Case |
| ----- | -------- | -------- |
| Primary Blue | `--primary` (#2563EB) | Main brand orbs, CTAs |
| Accent Sky | `--accent-foreground` (#0369A1) | Secondary highlights |
| Highlight Amber | `--highlight` (#F59E0B) | Attention accents |

## Background Techniques

### 1. Gradient Orbs (Blurred Color Blobs)

Large, soft circles that create depth and visual warmth:

```tsx
function FloatingShape({ className, style, animation }: FloatingShapeProps) {
  return (
    <div
      className={cn("absolute rounded-full blur-3xl", className)}
      style={{
        ...style,
        animation: animations[animation],
      }}
    />
  );
}

// Usage - Primary color orb
<FloatingShape
  className="h-[700px] w-[700px] bg-primary/35 opacity-35"
  animation="drift1"
  style={{ top: "-15%", left: "-10%" }}
/>
```

**Guidelines:**

- Use 3-9 orbs at different sizes (180px-700px)
- Layer primary, accent, and highlight colors
- Keep opacity between 20-40%
- Apply `blur-3xl` for soft edges
- Position partially off-screen for natural feel

### 2. Dot Grid Pattern

Subtle texture that adds sophistication:

```tsx
function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03] blur-[0.5px]"
      style={{
        backgroundImage: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
        backgroundSize: "48px 48px",
      }}
    />
  );
}
```

**Guidelines:**

- Keep opacity very low (0.02-0.05)
- Use 32-64px spacing
- Add slight blur for softness
- Use `currentColor` for theme compatibility

### 3. Geometric Wireframes

Floating shapes that add visual interest:

```tsx
function GeometricShape({ className, style, animation }: FloatingShapeProps) {
  return (
    <div
      className={cn("absolute rounded-2xl border blur-[2px]", className)}
      style={{
        ...style,
        animation: animations[animation],
      }}
    />
  );
}

// Usage - Rotating square
<GeometricShape
  className="h-40 w-40 border-primary/18 rotate-12"
  animation="drift1"
  style={{ top: "20%", right: "12%" }}
/>

// Diamond shape
<div
  className="absolute h-8 w-8 rotate-45 border border-primary/15 blur-[1px]"
  style={{ top: "28%", left: "75%", animation: "drift4 22s ease-in-out infinite" }}
/>
```

**Guidelines:**

- Use `border` instead of `bg` for wireframe effect
- Keep border opacity 15-20%
- Add `blur-[1px]` or `blur-[2px]` for softness
- Mix rounded rectangles, circles, and diamonds

### 4. Organic Drift Animations

Multi-point keyframes for natural movement:

```css
@keyframes drift1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  20% { transform: translate(60px, -40px) rotate(5deg); }
  40% { transform: translate(20px, 50px) rotate(-3deg); }
  60% { transform: translate(-50px, 20px) rotate(4deg); }
  80% { transform: translate(-30px, -60px) rotate(-2deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes drift2 {
  0% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-70px, 30px) scale(1.05); }
  50% { transform: translate(40px, 70px) scale(0.95); }
  75% { transform: translate(80px, -20px) scale(1.02); }
  100% { transform: translate(0, 0) scale(1); }
}
```

**Guidelines:**

- Use 18-28 second durations (longer = more subtle)
- Move 50-80px in multiple directions
- Add subtle rotation (2-6deg) for organic feel
- Include slight scale changes (0.95-1.05) for breathing
- Create 3-5 unique animations to avoid synchronization

## Implementation Pattern

### Component Structure

```tsx
"use client";

import { cn } from "@ui/lib";

interface FloatingShapeProps {
  className?: string;
  style?: React.CSSProperties;
  animation?: "drift1" | "drift2" | "drift3" | "drift4" | "drift5" | "pulse";
}

const animations = {
  drift1: "drift1 20s ease-in-out infinite",
  drift2: "drift2 25s ease-in-out infinite",
  drift3: "drift3 18s ease-in-out infinite",
  drift4: "drift4 22s ease-in-out infinite",
  drift5: "drift5 28s ease-in-out infinite",
  pulse: "pulse-glow 6s ease-in-out infinite",
};

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes drift1 { /* ... */ }
        @keyframes drift2 { /* ... */ }
        /* ... more keyframes */
      `}</style>

      {/* Dot grid */}
      <DotGrid />

      {/* Gradient orbs */}
      <FloatingShape /* ... */ />

      {/* Geometric shapes */}
      <GeometricShape /* ... */ />
    </div>
  );
}
```

### Layout Integration

Place the animated background in the marketing layout:

```tsx
// apps/web/app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <NavBar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
```

**Key points:**

- Use `position: fixed` for parallax effect on scroll
- Wrap content in `relative z-10` to appear above background
- Add `overflow-hidden` to prevent horizontal scroll from off-screen elements
- Include `pointer-events-none` to allow clicks through background

## Performance Considerations

### Animation Performance

| Technique | Impact | Recommendation |
| --------- | ------ | -------------- |
| CSS transforms | Low | Preferred - GPU accelerated |
| Filter blur | Medium | Use sparingly on large elements |
| Canvas/WebGL | Variable | Only for complex particle systems |
| Many DOM elements | High | Limit to 15-20 animated elements |

### Best Practices

1. **Use CSS transforms**: `translate`, `rotate`, `scale` are GPU-accelerated
2. **Limit blur on animated elements**: Blur recalculates on each frame
3. **Use `will-change` sparingly**: Only on actively animating elements
4. **Respect reduced motion**: Check `prefers-reduced-motion`

```tsx
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<FloatingShape
  style={{
    animation: prefersReducedMotion ? 'none' : animations.drift1,
  }}
/>
```

## External Resources

### shadcn/ui Background Components

- [shadcn.io/background](https://www.shadcn.io/background) - React background components
- [shadcnblocks.com/blocks/background](https://www.shadcnblocks.com/blocks/background) - 50+ background blocks

### Pattern Types Available

| Category | Examples |
| -------- | -------- |
| Shader-Based | Aurora, beams, waves, glitch effects |
| Pattern | Dots, grids, lines, custom decorative |
| Animated Gradients | Flowing colors, mesh gradients |
| Particle Systems | Interactive dots, connections |
| Light Effects | Glow, dispersion, spectral |
| Geometric | Abstract shapes, grid compositions |

## Related Skills

- **iconography**: Icon sizing and color system
- **typography**: Font system and text styling
- **architecture**: Component organization patterns and marketing layout structure
