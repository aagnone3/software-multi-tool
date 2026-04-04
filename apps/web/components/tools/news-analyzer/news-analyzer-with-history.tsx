"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import React, { useCallback } from "react";
import { NewsAnalyzer } from "./news-analyzer";
import { NewsAnalyzerHistory } from "./news-analyzer-history";

export function NewsAnalyzerWithHistory() {
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsString.withDefault("analyze"),
	);
	const { track } = useProductAnalytics();

	const handleTabChange = useCallback(
		(tab: string) => {
			setActiveTab(tab);
			track({
				name: "tool_tab_switched",
				props: { tool_slug: "news-analyzer", tab },
			});
		},
		[setActiveTab, track],
	);

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="w-full"
		>
			<TabsList className="grid w-full grid-cols-2 mb-6">
				<TabsTrigger value="analyze">Analyze Article</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
			</TabsList>

			<TabsContent value="analyze">
				<NewsAnalyzer />
			</TabsContent>

			<TabsContent value="history">
				<UpgradeGate
					featureName="Analysis History"
					description="View and revisit all your past news analyses in one place."
				>
					<NewsAnalyzerHistory />
				</UpgradeGate>
			</TabsContent>
		</Tabs>
	);
}
