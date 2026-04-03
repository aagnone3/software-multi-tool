"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import React, { useEffect } from "react";

export function ToolsIndexPageTracker() {
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({
			name: "tools_index_page_viewed",
			props: {},
		});
	}, [track]);

	return null;
}
