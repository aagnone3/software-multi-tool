"use client";

import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import { ChevronRightIcon, PieChartIcon, WrenchIcon } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useUsageStats } from "../../credits/hooks/use-usage-stats";

const TOOL_COLORS = [
	"bg-blue-500",
	"bg-emerald-500",
	"bg-violet-500",
	"bg-amber-500",
	"bg-rose-500",
	"bg-cyan-500",
	"bg-orange-500",
	"bg-teal-500",
];

interface CreditsByToolChartProps {
	className?: string;
	maxTools?: number;
}

export function CreditsByToolChart({
	className,
	maxTools = 6,
}: CreditsByToolChartProps) {
	const { byTool, totalUsed, isLoading } = useUsageStats();
	const { enabledTools } = useTools();

	const toolEntries = useMemo(() => {
		if (!byTool.length) {
			return [];
		}

		const sorted = [...byTool].sort((a, b) => b.credits - a.credits);
		const top = sorted.slice(0, maxTools);
		const otherCredits = sorted
			.slice(maxTools)
			.reduce((sum, t) => sum + t.credits, 0);

		const entries = top.map((t, i) => {
			const tool = enabledTools.find((et) => et.slug === t.toolSlug);
			const name =
				tool?.name ??
				t.toolSlug
					.split("-")
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(" ");
			const pct =
				totalUsed > 0 ? Math.round((t.credits / totalUsed) * 100) : 0;
			return {
				slug: t.toolSlug,
				name,
				credits: t.credits,
				pct,
				color: TOOL_COLORS[i % TOOL_COLORS.length],
			};
		});

		if (otherCredits > 0) {
			const otherPct =
				totalUsed > 0
					? Math.round((otherCredits / totalUsed) * 100)
					: 0;
			entries.push({
				slug: "_other",
				name: "Other",
				credits: otherCredits,
				pct: otherPct,
				color: "bg-muted-foreground/40",
			});
		}

		return entries;
	}, [byTool, enabledTools, maxTools, totalUsed]);

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PieChartIcon className="size-5" />
						Credits by Tool
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-7 w-full" />
					))}
				</CardContent>
			</Card>
		);
	}

	if (!toolEntries.length) {
		return (
			<Card className={className}>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2">
						<PieChartIcon className="size-5" />
						Credits by Tool
					</CardTitle>
					<CardDescription>Credit usage breakdown</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<WrenchIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm font-medium">No usage yet</p>
						<p className="text-xs text-muted-foreground mt-1">
							Run a tool to see credit breakdown here
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href="/app/tools">
								Browse tools
								<ChevronRightIcon className="size-4 ml-1" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<PieChartIcon className="size-5" />
					Credits by Tool
				</CardTitle>
				<CardDescription>
					{totalUsed} credits used this period
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-0">
				{/* Stacked bar */}
				<div className="flex h-3 w-full overflow-hidden rounded-full mb-4">
					{toolEntries.map((entry) => (
						<div
							key={entry.slug}
							className={cn("h-full transition-all", entry.color)}
							style={{ width: `${entry.pct}%` }}
							title={`${entry.name}: ${entry.credits} credits (${entry.pct}%)`}
						/>
					))}
				</div>

				{/* Legend */}
				<div className="space-y-2">
					{toolEntries.map((entry) => (
						<div
							key={entry.slug}
							className="flex items-center justify-between gap-2"
						>
							<div className="flex items-center gap-2 min-w-0">
								<div
									className={cn(
										"size-2.5 rounded-sm shrink-0",
										entry.color,
									)}
								/>
								{entry.slug !== "_other" ? (
									<Link
										href={`/app/tools/${entry.slug}`}
										className="text-sm truncate hover:text-primary transition-colors"
									>
										{entry.name}
									</Link>
								) : (
									<span className="text-sm text-muted-foreground truncate">
										{entry.name}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-xs text-muted-foreground">
									{entry.credits}
								</span>
								<span className="text-xs font-medium w-8 text-right">
									{entry.pct}%
								</span>
							</div>
						</div>
					))}
				</div>

				<div className="pt-3">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground hover:text-foreground"
						asChild
					>
						<Link href="/app/settings/usage">
							View detailed usage
							<ChevronRightIcon className="size-4 ml-auto" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
