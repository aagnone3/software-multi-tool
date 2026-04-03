"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import React, { useEffect } from "react";

interface ToolLandingPageTrackerProps {
	toolSlug: string;
	toolName: string;
}

export function ToolLandingPageTracker({
	toolSlug,
	toolName,
}: ToolLandingPageTrackerProps) {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({
			name: "tool_marketing_page_viewed",
			props: { tool_slug: toolSlug, tool_name: toolName },
		});
	}, [track, toolSlug, toolName]);

	return null;
}
