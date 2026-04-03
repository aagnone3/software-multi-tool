"use client";

import { useTrack } from "@analytics/hooks/use-product-analytics";
import { useRecentlyViewedTools } from "@saas/tools/hooks/use-recently-viewed-tools";
import { useEffect } from "react";

interface ToolViewTrackerProps {
	toolSlug: string;
	toolName: string;
}

/**
 * Invisible client component that records a tool view in localStorage
 * and fires an analytics event when mounted. Drop into any tool detail page.
 */
export function ToolViewTracker({ toolSlug, toolName }: ToolViewTrackerProps) {
	const { recordView } = useRecentlyViewedTools();
	const { track } = useProductAnalytics();

	useEffect(() => {
		recordView(toolSlug);
		track("tool_page_viewed", { tool_slug: toolSlug, tool_name: toolName });
	}, [toolSlug, toolName, recordView, track]);

	return null;
}
