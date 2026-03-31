"use client";

import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import { NewsAnalyzer } from "./news-analyzer";
import { NewsAnalyzerHistory } from "./news-analyzer-history";

export function NewsAnalyzerWithHistory() {
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsString.withDefault("analyze"),
	);

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
