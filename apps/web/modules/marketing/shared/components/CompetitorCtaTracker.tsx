"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import type { ReactNode } from "react";
import React, { useCallback } from "react";

interface CompetitorCtaTrackerProps {
	competitorSlug: string;
	ctaType: "signup" | "pricing";
	position: "hero" | "footer";
	children: ReactNode;
}

export function CompetitorCtaTracker({
	competitorSlug,
	ctaType,
	position,
	children,
}: CompetitorCtaTrackerProps) {
	const { track } = useProductAnalytics();

	const handleClick = useCallback(() => {
		track({
			name: "competitor_page_cta_clicked",
			props: {
				competitor_slug: competitorSlug,
				cta_type: ctaType,
				position,
			},
		});
	}, [track, competitorSlug, ctaType, position]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div for analytics
		// biome-ignore lint/a11y/noStaticElementInteractions: wrapper div for analytics click capture
		<div onClick={handleClick} style={{ display: "contents" }}>
			{children}
		</div>
	);
}
