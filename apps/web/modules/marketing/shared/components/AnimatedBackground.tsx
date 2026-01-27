"use client";

import { cn } from "@ui/lib";
import { useEffect, useState } from "react";

interface FloatingShapeProps {
	className?: string;
	style?: React.CSSProperties;
	animation?: "drift1" | "drift2" | "drift3" | "drift4" | "drift5" | "pulse";
	reducedMotion?: boolean;
}

const animations = {
	drift1: "drift1 20s ease-in-out infinite",
	drift2: "drift2 25s ease-in-out infinite",
	drift3: "drift3 18s ease-in-out infinite",
	drift4: "drift4 22s ease-in-out infinite",
	drift5: "drift5 28s ease-in-out infinite",
	pulse: "pulse-glow 6s ease-in-out infinite",
};

function FloatingShape({
	className,
	style,
	animation = "drift1",
	reducedMotion = false,
}: FloatingShapeProps) {
	return (
		<div
			className={cn("absolute rounded-full blur-3xl", className)}
			style={{
				...style,
				animation: reducedMotion ? "none" : animations[animation],
			}}
		/>
	);
}

function GeometricShape({
	className,
	style,
	animation = "drift1",
	reducedMotion = false,
}: FloatingShapeProps) {
	return (
		<div
			className={cn("absolute rounded-2xl border blur-[2px]", className)}
			style={{
				...style,
				animation: reducedMotion ? "none" : animations[animation],
			}}
		/>
	);
}

function DotGrid() {
	return (
		<div
			className="pointer-events-none absolute inset-0 opacity-[0.03] blur-[0.5px]"
			style={{
				backgroundImage:
					"radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
				backgroundSize: "48px 48px",
			}}
		/>
	);
}

/** Aurora/mesh gradient base layer - creates smooth flowing color wash */
function AuroraLayer({ reducedMotion = false }: { reducedMotion?: boolean }) {
	return (
		<div
			className="absolute inset-0 opacity-40"
			style={{
				background: `
					radial-gradient(ellipse 80% 50% at 20% 40%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
					radial-gradient(ellipse 60% 80% at 80% 20%, rgba(3, 105, 161, 0.12) 0%, transparent 50%),
					radial-gradient(ellipse 70% 60% at 60% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
					radial-gradient(ellipse 50% 70% at 10% 90%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)
				`,
				backgroundSize: "200% 200%",
				animation: reducedMotion
					? "none"
					: "aurora-shift 30s ease-in-out infinite",
			}}
		/>
	);
}

/** Subtle noise texture overlay for tactile depth */
function NoiseTexture() {
	return (
		<div
			className="pointer-events-none absolute inset-0 opacity-[0.015]"
			style={{
				backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
			}}
		/>
	);
}

/** Animated glow beams - subtle light rays */
function GlowBeam({
	className,
	style,
	reducedMotion = false,
}: {
	className?: string;
	style?: React.CSSProperties;
	reducedMotion?: boolean;
}) {
	return (
		<div
			className={cn(
				"absolute h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-[1px]",
				className,
			)}
			style={{
				...style,
				animation: reducedMotion
					? "none"
					: "beam-sweep 12s ease-in-out infinite",
			}}
		/>
	);
}

export function AnimatedBackground() {
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		setReducedMotion(mediaQuery.matches);

		const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return (
		<div className="pointer-events-none fixed inset-0 overflow-hidden">
			{/* CSS Keyframes - organic wandering paths */}
			<style jsx global>{`
				@keyframes aurora-shift {
					0%, 100% {
						background-position: 0% 50%;
					}
					25% {
						background-position: 100% 25%;
					}
					50% {
						background-position: 50% 100%;
					}
					75% {
						background-position: 25% 0%;
					}
				}

				@keyframes beam-sweep {
					0%, 100% {
						opacity: 0;
						transform: translateX(-100%) scaleX(0.5);
					}
					20% {
						opacity: 0.6;
					}
					50% {
						opacity: 0.8;
						transform: translateX(50%) scaleX(1);
					}
					80% {
						opacity: 0.6;
					}
					100% {
						opacity: 0;
						transform: translateX(200%) scaleX(0.5);
					}
				}

				@keyframes drift1 {
					0% {
						transform: translate(0, 0) rotate(0deg);
					}
					20% {
						transform: translate(60px, -40px) rotate(5deg);
					}
					40% {
						transform: translate(20px, 50px) rotate(-3deg);
					}
					60% {
						transform: translate(-50px, 20px) rotate(4deg);
					}
					80% {
						transform: translate(-30px, -60px) rotate(-2deg);
					}
					100% {
						transform: translate(0, 0) rotate(0deg);
					}
				}

				@keyframes drift2 {
					0% {
						transform: translate(0, 0) scale(1);
					}
					25% {
						transform: translate(-70px, 30px) scale(1.05);
					}
					50% {
						transform: translate(40px, 70px) scale(0.95);
					}
					75% {
						transform: translate(80px, -20px) scale(1.02);
					}
					100% {
						transform: translate(0, 0) scale(1);
					}
				}

				@keyframes drift3 {
					0% {
						transform: translate(0, 0) rotate(0deg);
					}
					15% {
						transform: translate(45px, 55px) rotate(-4deg);
					}
					35% {
						transform: translate(-35px, 80px) rotate(6deg);
					}
					55% {
						transform: translate(-75px, 25px) rotate(-2deg);
					}
					75% {
						transform: translate(25px, -45px) rotate(3deg);
					}
					100% {
						transform: translate(0, 0) rotate(0deg);
					}
				}

				@keyframes drift4 {
					0% {
						transform: translate(0, 0) scale(1) rotate(0deg);
					}
					20% {
						transform: translate(-55px, -35px) scale(1.03) rotate(-5deg);
					}
					45% {
						transform: translate(65px, 45px) scale(0.97) rotate(4deg);
					}
					70% {
						transform: translate(30px, -70px) scale(1.04) rotate(-3deg);
					}
					100% {
						transform: translate(0, 0) scale(1) rotate(0deg);
					}
				}

				@keyframes drift5 {
					0% {
						transform: translate(0, 0) rotate(0deg);
					}
					18% {
						transform: translate(50px, 65px) rotate(6deg);
					}
					38% {
						transform: translate(-60px, 40px) rotate(-4deg);
					}
					58% {
						transform: translate(-40px, -55px) rotate(5deg);
					}
					78% {
						transform: translate(70px, -30px) rotate(-3deg);
					}
					100% {
						transform: translate(0, 0) rotate(0deg);
					}
				}

				@keyframes pulse-glow {
					0%, 100% {
						opacity: 0.15;
						transform: scale(1);
					}
					50% {
						opacity: 0.28;
						transform: scale(1.12);
					}
				}
			`}</style>

			{/* Layer 1: Aurora/mesh gradient base - subtle flowing colors */}
			<AuroraLayer reducedMotion={reducedMotion} />

			{/* Layer 2: Noise texture for depth */}
			<NoiseTexture />

			{/* Layer 3: Dot grid pattern */}
			<DotGrid />

			{/* Layer 4: Large gradient orbs - primary color */}
			<FloatingShape
				className="h-[700px] w-[700px] bg-primary/35 opacity-35"
				animation="drift1"
				reducedMotion={reducedMotion}
				style={{ top: "-15%", left: "-10%" }}
			/>
			<FloatingShape
				className="h-[600px] w-[600px] bg-primary/30 opacity-30"
				animation="drift2"
				reducedMotion={reducedMotion}
				style={{ top: "15%", right: "-15%" }}
			/>
			<FloatingShape
				className="h-[550px] w-[550px] bg-primary/25 opacity-25"
				animation="drift3"
				reducedMotion={reducedMotion}
				style={{ bottom: "-10%", left: "20%" }}
			/>

			{/* Accent color orbs - sky blue */}
			<FloatingShape
				className="h-[450px] w-[450px] bg-accent-foreground/35 opacity-30"
				animation="drift4"
				reducedMotion={reducedMotion}
				style={{ top: "40%", left: "5%" }}
			/>
			<FloatingShape
				className="h-[400px] w-[400px] bg-accent-foreground/30 opacity-25"
				animation="drift5"
				reducedMotion={reducedMotion}
				style={{ bottom: "15%", right: "10%" }}
			/>
			<FloatingShape
				className="h-[350px] w-[350px] bg-accent-foreground/25 opacity-20"
				animation="drift1"
				reducedMotion={reducedMotion}
				style={{ top: "60%", right: "30%" }}
			/>

			{/* Highlight color orbs - amber accents */}
			<FloatingShape
				className="h-[280px] w-[280px] bg-highlight/40 opacity-30"
				animation="drift2"
				reducedMotion={reducedMotion}
				style={{ top: "10%", left: "35%" }}
			/>
			<FloatingShape
				className="h-[220px] w-[220px] bg-highlight/35 opacity-25"
				animation="drift3"
				reducedMotion={reducedMotion}
				style={{ bottom: "25%", left: "55%" }}
			/>
			<FloatingShape
				className="h-[180px] w-[180px] bg-highlight/30 opacity-20"
				animation="drift4"
				reducedMotion={reducedMotion}
				style={{ top: "45%", right: "15%" }}
			/>

			{/* Layer 5: Geometric border shapes - wandering */}
			<GeometricShape
				className="h-40 w-40 border-primary/18 rotate-12"
				animation="drift1"
				reducedMotion={reducedMotion}
				style={{ top: "20%", right: "12%" }}
			/>
			<GeometricShape
				className="h-32 w-32 border-primary/15 -rotate-6"
				animation="drift3"
				reducedMotion={reducedMotion}
				style={{ top: "55%", left: "15%" }}
			/>
			<GeometricShape
				className="h-28 w-28 border-highlight/20 rotate-45"
				animation="drift5"
				reducedMotion={reducedMotion}
				style={{ top: "35%", right: "28%" }}
			/>
			<GeometricShape
				className="h-24 w-24 rounded-full border-accent-foreground/18"
				animation="pulse"
				reducedMotion={reducedMotion}
				style={{ top: "65%", left: "35%" }}
			/>
			<GeometricShape
				className="h-36 w-36 border-primary/15 rotate-[30deg]"
				animation="drift2"
				reducedMotion={reducedMotion}
				style={{ bottom: "18%", right: "8%" }}
			/>
			<GeometricShape
				className="h-28 w-28 rounded-full border-primary/15"
				animation="pulse"
				reducedMotion={reducedMotion}
				style={{ top: "12%", left: "60%" }}
			/>

			{/* Layer 6: Floating diamonds */}
			<div
				className="absolute h-8 w-8 rotate-45 border border-primary/15 blur-[1px]"
				style={{
					top: "28%",
					left: "75%",
					animation: reducedMotion ? "none" : animations.drift4,
				}}
			/>
			<div
				className="absolute h-6 w-6 rotate-45 border border-highlight/18 blur-[1px]"
				style={{
					top: "62%",
					left: "8%",
					animation: reducedMotion ? "none" : animations.drift2,
				}}
			/>
			<div
				className="absolute h-5 w-5 rotate-45 border border-accent-foreground/15 blur-[1px]"
				style={{
					bottom: "35%",
					right: "25%",
					animation: reducedMotion ? "none" : animations.drift5,
				}}
			/>

			{/* Layer 7: Subtle glow beams - animated light rays */}
			<GlowBeam
				className="w-[60%]"
				reducedMotion={reducedMotion}
				style={{ top: "25%", left: "10%", animationDelay: "0s" }}
			/>
			<GlowBeam
				className="w-[40%]"
				reducedMotion={reducedMotion}
				style={{ top: "55%", left: "30%", animationDelay: "4s" }}
			/>
			<GlowBeam
				className="w-[50%]"
				reducedMotion={reducedMotion}
				style={{ top: "75%", left: "5%", animationDelay: "8s" }}
			/>
		</div>
	);
}
