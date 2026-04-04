"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useEffect } from "react";

export function PricingPageTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "pricing_page_viewed", props: {} });
	}, [track]);

	return null;
}
