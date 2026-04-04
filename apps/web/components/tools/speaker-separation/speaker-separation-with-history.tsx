"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { SpeakerSeparationTool } from "@tools/components/SpeakerSeparationTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import React, { useCallback } from "react";
import { SpeakerSeparationHistory } from "./speaker-separation-history";

export function SpeakerSeparationWithHistory() {
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
				props: { tool_slug: "speaker-separation", tab },
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
				<TabsTrigger value="analyze">Analyze Audio</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
			</TabsList>

			<TabsContent value="analyze">
				<SpeakerSeparationTool />
			</TabsContent>

			<TabsContent value="history">
				<UpgradeGate
					featureName="Transcription History"
					description="View and revisit all your past speaker separation transcriptions."
				>
					<SpeakerSeparationHistory />
				</UpgradeGate>
			</TabsContent>
		</Tabs>
	);
}
