"use client";

import { config } from "@repo/config";
import type { ToolConfig } from "@repo/config/types";
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
import {
	ChevronRightIcon,
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	ImageMinusIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface RecentlyUsedToolsProps {
	className?: string;
	maxTools?: number;
}

function getToolIcon(iconName: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		"image-minus": ImageMinusIcon,
		users: UsersIcon,
		newspaper: NewspaperIcon,
		receipt: ReceiptIcon,
		"file-text": FileTextIcon,
		"message-square-text": MessageSquareTextIcon,
		wallet: WalletIcon,
		"clipboard-list": ClipboardListIcon,
	};

	return icons[iconName] || WrenchIcon;
}

function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return "Just now";
	}
	if (diffMins < 60) {
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString();
}

export function RecentlyUsedTools({
	className,
	maxTools = 5,
}: RecentlyUsedToolsProps) {
	const { recentToolSlugs, recentToolsMap, isLoading } = useRecentJobs(20);

	// Get tool configs for recent tools
	const recentTools: Array<{ tool: ToolConfig; lastUsed: string }> = [];
	for (const slug of recentToolSlugs.slice(0, maxTools)) {
		const toolConfig = config.tools.registry.find((t) => t.slug === slug);
		const lastJob = recentToolsMap.get(slug);
		if (toolConfig && lastJob) {
			recentTools.push({
				tool: toolConfig,
				lastUsed: lastJob.createdAt,
			});
		}
	}

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ClockIcon className="size-5" />
						Recently Used
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="flex items-center gap-3"
						>
							<Skeleton className="size-10 rounded-lg" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (recentTools.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ClockIcon className="size-5" />
						Recently Used
					</CardTitle>
					<CardDescription>Your recently used tools</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<WrenchIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No tools used yet
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href="/app/tools">
								Explore tools
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
					<ClockIcon className="size-5" />
					Recently Used
				</CardTitle>
				<CardDescription>
					Quick access to your recent tools
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-1">
				{recentTools.map(({ tool, lastUsed }) => {
					const Icon = getToolIcon(tool.icon);
					return (
						<Link
							key={tool.slug}
							href={`/app/tools/${tool.slug}`}
							className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
						>
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<Icon className="size-5" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">
									{tool.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatTimeAgo(lastUsed)}
								</p>
							</div>
							<ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
						</Link>
					);
				})}

				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full"
						asChild
					>
						<Link href="/app/tools">
							View all tools
							<ChevronRightIcon className="size-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
