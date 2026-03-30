"use client";

import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	CheckCircleIcon,
	CoinsIcon,
	RocketIcon,
	SparklesIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

const HIGHLIGHTS = [
	{
		icon: CoinsIcon,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		title: "Credits unlocked",
		desc: "Your plan credits are ready to use. Each tool run costs a fixed number of credits — check the tool page for details.",
	},
	{
		icon: ZapIcon,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		title: "Priority processing",
		desc: "Pro jobs jump the queue. Expect faster results, especially during peak hours.",
	},
	{
		icon: SparklesIcon,
		color: "text-primary",
		bg: "bg-primary/10",
		title: "All tools included",
		desc: "Every tool in the platform is available to you — no per-tool restrictions.",
	},
];

export function PostUpgradeWelcome() {
	const { enabledTools } = useTools();
	const firstTool = enabledTools[0];

	return (
		<main className="container flex min-h-[80vh] flex-col items-center justify-center py-20 text-center">
			{/* Celebration icon */}
			<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
				<CheckCircleIcon className="size-10 text-primary" />
			</div>

			<h1 className="font-bold text-3xl md:text-4xl">
				You're now on Pro 🎉
			</h1>
			<p className="mx-auto mt-3 max-w-md text-foreground/70 text-lg">
				Thanks for upgrading. Your credits are live and every tool is
				ready to go.
			</p>

			{/* Highlights */}
			<div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
				{HIGHLIGHTS.map(({ icon: Icon, color, bg, title, desc }) => (
					<div
						key={title}
						className="flex flex-col items-center gap-3 rounded-xl border bg-background p-5 text-center"
					>
						<div
							className={`flex size-10 items-center justify-center rounded-full ${bg}`}
						>
							<Icon className={`size-5 ${color}`} />
						</div>
						<p className="font-semibold text-sm">{title}</p>
						<p className="text-foreground/60 text-xs leading-relaxed">
							{desc}
						</p>
					</div>
				))}
			</div>

			{/* CTAs */}
			<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
				<Button asChild size="lg">
					<Link
						href={
							firstTool
								? `/app/tools/${firstTool.slug}`
								: "/app/tools"
						}
					>
						<RocketIcon className="mr-2 size-4" />
						Run your first Pro tool
					</Link>
				</Button>
				<Button asChild size="lg" variant="outline">
					<Link href="/app/tools">
						Browse all tools
						<ArrowRightIcon className="ml-2 size-4" />
					</Link>
				</Button>
			</div>

			<p className="mt-8 text-foreground/50 text-xs">
				Questions?{" "}
				<Link
					href="/app/settings/billing"
					className="underline hover:text-foreground"
				>
					Manage billing
				</Link>
				.
			</p>
		</main>
	);
}
