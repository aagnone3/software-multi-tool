"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useEffect } from "react";

export function UseCasesPageTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "use_cases_page_viewed", props: {} });
	}, [track]);

	return null;
}
