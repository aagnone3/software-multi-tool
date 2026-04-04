"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useEffect } from "react";

export function ChoosePlanTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "choose_plan_page_viewed", props: {} });
	}, [track]);

	return null;
}
