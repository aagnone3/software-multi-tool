"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback } from "react";

interface ToolLandingCtaTrackerProps {
	toolSlug: string;
	toolName: string;
	source?: string;
	href?: string;
	label?: string;
	size?: "md" | "lg" | "sm";
}

export function ToolLandingCtaTracker({
	toolSlug,
	toolName,
	source = "tool_marketing_page",
	href = "/auth/signup",
	label = "Get Started Free",
	size = "lg",
}: ToolLandingCtaTrackerProps) {
	const { track } = useProductAnalytics();

	const handleClick = useCallback(() => {
		track({
			name: "tool_marketing_cta_clicked",
			props: { tool_slug: toolSlug, tool_name: toolName, source },
		});
	}, [track, toolSlug, toolName, source]);

	return (
		<Button size={size} variant="primary" asChild>
			<Link href={href} onClick={handleClick}>
				{label}
				<ArrowRightIcon className="ml-2 size-4" />
			</Link>
		</Button>
	);
}
