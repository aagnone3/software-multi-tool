"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useEffect } from "react";

export function IntegrationsPageTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "integrations_page_viewed", props: {} });
	}, [track]);

	return null;
}
