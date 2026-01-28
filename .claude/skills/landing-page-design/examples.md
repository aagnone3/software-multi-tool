# Landing Page Design Examples

Real-world examples from this codebase and implementation patterns for landing page backgrounds.

## Example 1: Full Animated Background (Current Implementation)

File: `apps/web/modules/marketing/shared/components/AnimatedBackground.tsx`

This is the production implementation used on the AI Multitool landing page:

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

function FloatingShape({ className, style, animation = "drift1" }: FloatingShapeProps) {
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

function GeometricShape({ className, style, animation = "drift1" }: FloatingShapeProps) {
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

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* CSS Keyframes - organic wandering paths */}
      <style jsx global>{`
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

        @keyframes drift3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(45px, 55px) rotate(-4deg); }
          35% { transform: translate(-35px, 80px) rotate(6deg); }
          55% { transform: translate(-75px, 25px) rotate(-2deg); }
          75% { transform: translate(25px, -45px) rotate(3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes drift4 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          20% { transform: translate(-55px, -35px) scale(1.03) rotate(-5deg); }
          45% { transform: translate(65px, 45px) scale(0.97) rotate(4deg); }
          70% { transform: translate(30px, -70px) scale(1.04) rotate(-3deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }

        @keyframes drift5 {
          0% { transform: translate(0, 0) rotate(0deg); }
          18% { transform: translate(50px, 65px) rotate(6deg); }
          38% { transform: translate(-60px, 40px) rotate(-4deg); }
          58% { transform: translate(-40px, -55px) rotate(5deg); }
          78% { transform: translate(70px, -30px) rotate(-3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(1.12); }
        }
      `}</style>

      {/* Dot grid pattern */}
      <DotGrid />

      {/* Large gradient orbs - primary color */}
      <FloatingShape
        className="h-[700px] w-[700px] bg-primary/35 opacity-35"
        animation="drift1"
        style={{ top: "-15%", left: "-10%" }}
      />
      <FloatingShape
        className="h-[600px] w-[600px] bg-primary/30 opacity-30"
        animation="drift2"
        style={{ top: "15%", right: "-15%" }}
      />
      <FloatingShape
        className="h-[550px] w-[550px] bg-primary/25 opacity-25"
        animation="drift3"
        style={{ bottom: "-10%", left: "20%" }}
      />

      {/* Accent color orbs - sky blue */}
      <FloatingShape
        className="h-[450px] w-[450px] bg-accent-foreground/35 opacity-30"
        animation="drift4"
        style={{ top: "40%", left: "5%" }}
      />
      <FloatingShape
        className="h-[400px] w-[400px] bg-accent-foreground/30 opacity-25"
        animation="drift5"
        style={{ bottom: "15%", right: "10%" }}
      />
      <FloatingShape
        className="h-[350px] w-[350px] bg-accent-foreground/25 opacity-20"
        animation="drift1"
        style={{ top: "60%", right: "30%" }}
      />

      {/* Highlight color orbs - amber accents */}
      <FloatingShape
        className="h-[280px] w-[280px] bg-highlight/40 opacity-30"
        animation="drift2"
        style={{ top: "10%", left: "35%" }}
      />
      <FloatingShape
        className="h-[220px] w-[220px] bg-highlight/35 opacity-25"
        animation="drift3"
        style={{ bottom: "25%", left: "55%" }}
      />
      <FloatingShape
        className="h-[180px] w-[180px] bg-highlight/30 opacity-20"
        animation="drift4"
        style={{ top: "45%", right: "15%" }}
      />

      {/* Geometric border shapes - wandering */}
      <GeometricShape
        className="h-40 w-40 border-primary/18 rotate-12"
        animation="drift1"
        style={{ top: "20%", right: "12%" }}
      />
      <GeometricShape
        className="h-32 w-32 border-primary/15 -rotate-6"
        animation="drift3"
        style={{ top: "55%", left: "15%" }}
      />
      <GeometricShape
        className="h-28 w-28 border-highlight/20 rotate-45"
        animation="drift5"
        style={{ top: "35%", right: "28%" }}
      />
      <GeometricShape
        className="h-24 w-24 rounded-full border-accent-foreground/18"
        animation="pulse"
        style={{ top: "65%", left: "35%" }}
      />
      <GeometricShape
        className="h-36 w-36 border-primary/15 rotate-[30deg]"
        animation="drift2"
        style={{ bottom: "18%", right: "8%" }}
      />
      <GeometricShape
        className="h-28 w-28 rounded-full border-primary/15"
        animation="pulse"
        style={{ top: "12%", left: "60%" }}
      />

      {/* A few floating diamonds */}
      <div
        className="absolute h-8 w-8 rotate-45 border border-primary/15 blur-[1px]"
        style={{ top: "28%", left: "75%", animation: animations.drift4 }}
      />
      <div
        className="absolute h-6 w-6 rotate-45 border border-highlight/18 blur-[1px]"
        style={{ top: "62%", left: "8%", animation: animations.drift2 }}
      />
      <div
        className="absolute h-5 w-5 rotate-45 border border-accent-foreground/15 blur-[1px]"
        style={{ bottom: "35%", right: "25%", animation: animations.drift5 }}
      />
    </div>
  );
}
```

---

## Example 2: Minimal Gradient Background

For pages that need a lighter visual treatment:

```tsx
"use client";

export function MinimalBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Single large ambient gradient */}
      <div
        className="absolute h-[800px] w-[800px] rounded-full bg-primary/20 opacity-30 blur-3xl"
        style={{ top: "-20%", left: "-10%" }}
      />
      <div
        className="absolute h-[600px] w-[600px] rounded-full bg-accent-foreground/15 opacity-25 blur-3xl"
        style={{ bottom: "-15%", right: "-10%" }}
      />
    </div>
  );
}
```

---

## Example 3: Grid Pattern Background

Technical/developer-focused aesthetic:

```tsx
"use client";

export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* SVG Grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern
            id="grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Gradient fade at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}
```

---

## Example 4: Particles with Canvas (Performance-Optimized)

For interactive particle effects:

```tsx
"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
    }));

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      ctx.fillStyle = "rgba(37, 99, 235, 0.3)"; // primary color
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ opacity: 0.5 }}
    />
  );
}
```

---

## Example 5: Respecting Reduced Motion

Accessible implementation that disables animations for users who prefer reduced motion:

```tsx
"use client";

import { useEffect, useState } from "react";

export function AccessibleBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute h-[600px] w-[600px] rounded-full bg-primary/30 blur-3xl"
        style={{
          top: "-10%",
          left: "-5%",
          animation: prefersReducedMotion
            ? "none"
            : "drift1 20s ease-in-out infinite",
        }}
      />
    </div>
  );
}
```

---

## Layout Integration Example

How to integrate backgrounds into the marketing layout:

```tsx
// apps/web/app/(marketing)/layout.tsx
import { AnimatedBackground } from "@marketing/shared/components/AnimatedBackground";
import { NavBar } from "@marketing/shared/components/NavBar";
import { Footer } from "@marketing/shared/components/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background layer - fixed position for parallax */}
      <AnimatedBackground />

      {/* Content layer - above background */}
      <div className="relative z-10">
        <NavBar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
```

---

## Color Palette Reference

The landing page uses the brand color palette from `tooling/tailwind/theme.css`:

```css
/* Primary - Blue (Professional & Trustworthy) */
--primary: #2563EB;

/* Accent - Sky Blue (Interactive) */
--accent-foreground: #0369A1;

/* Highlight - Amber (Attention) */
--highlight: #F59E0B;
```

Use these with Tailwind color utilities:

| Element | Light Mode | Dark Mode |
| ------- | ---------- | --------- |
| Primary orbs | `bg-primary/35` | `bg-primary/25` |
| Accent orbs | `bg-accent-foreground/35` | `bg-accent-foreground/25` |
| Highlight orbs | `bg-highlight/40` | `bg-highlight/30` |
| Geometric borders | `border-primary/18` | `border-primary/12` |
