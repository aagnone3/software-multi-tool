"use client";

import { useRecentlyViewedTools } from "@saas/tools/hooks/use-recently-viewed-tools";
import { useEffect } from "react";

interface ToolViewTrackerProps {
	toolSlug: string;
}

/**
 * Invisible client component that records a tool view in localStorage
 * when mounted. Drop into any tool detail page.
 */
export function ToolViewTracker({ toolSlug }: ToolViewTrackerProps) {
	const { recordView } = useRecentlyViewedTools();

	useEffect(() => {
		recordView(toolSlug);
	}, [toolSlug, recordView]);

	return null;
}
