"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { useRecentlyViewedTools } from "@saas/tools/hooks/use-recently-viewed-tools";
import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { ClockIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface RecentlyViewedToolsWidgetProps {
	className?: string;
}

function formatRelativeTime(isoString: string): string {
	const ms = Date.now() - new Date(isoString).getTime();
	const mins = Math.floor(ms / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	return `${days}d ago`;
}

export function RecentlyViewedToolsWidget({
	className,
}: RecentlyViewedToolsWidgetProps) {
	const { recentTools } = useRecentlyViewedTools();
	const { enabledTools } = useTools();
	const { track } = useProductAnalytics();

	if (recentTools.length === 0) return null;

	const toolsWithMeta = recentTools
		.map((rt) => {
			const meta =
				enabledTools.find((t) => t.slug === rt.slug) ??
				config.tools.registry.find((t) => t.slug === rt.slug);
			if (!meta) return null;
			return { ...rt, name: meta.name };
		})
		.filter(Boolean) as Array<{
		slug: string;
		viewedAt: string;
		name: string;
	}>;

	if (toolsWithMeta.length === 0) return null;

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base font-medium">
					<ClockIcon className="size-4 text-muted-foreground" />
					Recently Viewed
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{toolsWithMeta.map((tool) => (
						<li
							key={tool.slug}
							className="flex items-center justify-between"
						>
							<Link
								href={`/app/tools/${tool.slug}`}
								className="text-sm hover:underline font-medium truncate max-w-[60%]"
								onClick={() =>
									track({
										name: "dashboard_recently_viewed_tool_clicked",
										props: {
											tool_slug: tool.slug,
											tool_name: tool.name,
										},
									})
								}
							>
								{tool.name}
							</Link>
							<span className="text-xs text-muted-foreground shrink-0">
								{formatRelativeTime(tool.viewedAt)}
							</span>
						</li>
					))}
				</ul>
				<Button
					variant="ghost"
					size="sm"
					className="w-full mt-3"
					asChild
				>
					<Link href="/app/tools">Browse all tools</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
