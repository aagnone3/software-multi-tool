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
import { cn } from "@ui/lib";
import { ChevronRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface UntriedToolsWidgetProps {
	className?: string;
	maxTools?: number;
}

export function UntriedToolsWidget({
	className,
	maxTools = 4,
}: UntriedToolsWidgetProps) {
	const { enabledTools } = useTools();
	const { jobs } = useRecentJobs(100);

	// Find tools the user has never run
	const usedSlugs = new Set(jobs.map((j) => j.toolSlug));
	const untriedTools = enabledTools
		.filter((tool) => !usedSlugs.has(tool.slug))
		.slice(0, maxTools);

	// If user has tried all tools or no tools configured, render nothing
	if (enabledTools.length === 0 || untriedTools.length === 0) {
		return null;
	}

	return (
		<Card className={cn("", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<SparklesIcon className="size-5" />
					Try something new
				</CardTitle>
				<CardDescription>
					Tools you haven&apos;t used yet
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				{untriedTools.map((tool) => (
					<Link
						key={tool.slug}
						href={`/app/tools/${tool.slug}`}
						className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors group"
					>
						<div className="min-w-0">
							<p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
								{tool.name}
							</p>
							{tool.creditCost != null && (
								<p className="text-xs text-muted-foreground">
									{tool.creditCost} credit
									{tool.creditCost !== 1 ? "s" : ""}
								</p>
							)}
						</div>
						<ChevronRightIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
					</Link>
				))}
				{enabledTools.filter((t) => !usedSlugs.has(t.slug)).length >
					maxTools && (
					<Button
						variant="ghost"
						size="sm"
						className="w-full mt-1"
						asChild
					>
						<Link href="/app/tools">
							See all untried tools
							<ChevronRightIcon className="size-4 ml-1" />
						</Link>
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
