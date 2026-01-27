"use client";

import { config } from "@repo/config";
import { NavBar } from "@saas/shared/components/NavBar";
import { cn } from "@ui/lib";
import type { PropsWithChildren } from "react";

/** Subtle animated background for the sidebar area */
function SidebarBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Animated gradient mesh */}
			<div
				className="absolute inset-0 opacity-60"
				style={{
					background: `
						radial-gradient(ellipse 120% 80% at 10% 20%, rgba(37, 99, 235, 0.12) 0%, transparent 50%),
						radial-gradient(ellipse 80% 100% at 80% 80%, rgba(3, 105, 161, 0.08) 0%, transparent 50%),
						radial-gradient(ellipse 60% 60% at 20% 90%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)
					`,
					backgroundSize: "200% 200%",
					animation: "sidebar-gradient 25s ease-in-out infinite",
				}}
			/>

			{/* Subtle floating orb */}
			<div
				className="absolute h-[300px] w-[300px] rounded-full bg-primary/8 blur-3xl"
				style={{
					top: "10%",
					left: "-20%",
					animation: "sidebar-float 20s ease-in-out infinite",
				}}
			/>

			{/* Accent orb */}
			<div
				className="absolute h-[200px] w-[200px] rounded-full bg-accent-foreground/6 blur-3xl"
				style={{
					bottom: "20%",
					left: "10%",
					animation: "sidebar-float 25s ease-in-out infinite reverse",
				}}
			/>

			{/* CSS animations */}
			<style jsx global>{`
				@keyframes sidebar-gradient {
					0%, 100% {
						background-position: 0% 0%;
					}
					50% {
						background-position: 100% 100%;
					}
				}

				@keyframes sidebar-float {
					0%, 100% {
						transform: translate(0, 0) scale(1);
					}
					33% {
						transform: translate(20px, 30px) scale(1.05);
					}
					66% {
						transform: translate(-10px, -20px) scale(0.95);
					}
				}
			`}</style>
		</div>
	);
}

export function AppWrapper({ children }: PropsWithChildren) {
	const useSidebarLayout = config.ui.saas.useSidebarLayout;

	return (
		<div className="relative min-h-screen">
			{/* Enhanced gradient background */}
			<div
				className={cn(
					"fixed inset-0 -z-10",
					"bg-[radial-gradient(ellipse_120%_80%_at_10%_20%,color-mix(in_oklch,var(--color-primary),transparent_92%)_0%,transparent_50%),radial-gradient(ellipse_80%_60%_at_90%_80%,color-mix(in_oklch,var(--color-accent-foreground),transparent_94%)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_50%_50%,color-mix(in_oklch,var(--color-highlight),transparent_97%)_0%,transparent_50%)]",
					"dark:bg-[radial-gradient(ellipse_120%_80%_at_10%_20%,color-mix(in_oklch,var(--color-primary),transparent_88%)_0%,transparent_50%),radial-gradient(ellipse_80%_60%_at_90%_80%,color-mix(in_oklch,var(--color-accent-foreground),transparent_90%)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_50%_50%,color-mix(in_oklch,var(--color-highlight),transparent_95%)_0%,transparent_50%)]",
				)}
			/>

			{/* Background color base */}
			<div className="fixed inset-0 -z-20 bg-background" />

			{/* Sidebar animated background (only in sidebar layout) */}
			{useSidebarLayout && (
				<div className="fixed top-0 left-0 hidden h-full w-[280px] md:block">
					<SidebarBackground />
				</div>
			)}

			<NavBar />
			<div
				className={cn("md:pr-4 py-4 flex", [
					useSidebarLayout ? "min-h-[calc(100vh)] md:ml-[280px]" : "",
				])}
			>
				<main
					className={cn(
						"py-6 border rounded-2xl bg-card/95 backdrop-blur-sm px-4 md:p-8 min-h-full w-full shadow-sm",
						[useSidebarLayout ? "" : ""],
					)}
				>
					<div className="container px-0">{children}</div>
				</main>
			</div>
		</div>
	);
}
