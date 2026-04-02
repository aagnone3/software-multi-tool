"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useEffect } from "react";

interface CompetitorPageTrackerProps {
	competitorSlug: string;
	competitorName: string;
}

export function CompetitorPageTracker({
	competitorSlug,
	competitorName,
}: CompetitorPageTrackerProps) {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({
			name: "competitor_page_viewed",
			props: {
				competitor_slug: competitorSlug,
				competitor_name: competitorName,
			},
		});
	}, [track, competitorSlug, competitorName]);

	return null;
}
