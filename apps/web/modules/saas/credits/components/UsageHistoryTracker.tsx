"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import React, { useEffect } from "react";

export function UsageHistoryTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "usage_history_page_viewed", props: {} });
	}, [track]);

	return null;
}
