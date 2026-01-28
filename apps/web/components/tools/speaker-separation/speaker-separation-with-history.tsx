"use client";

import { SpeakerSeparationTool } from "@tools/components/SpeakerSeparationTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import { SpeakerSeparationHistory } from "./speaker-separation-history";

export function SpeakerSeparationWithHistory() {
	const [activeTab, setActiveTab] = useQueryState(
		"tab",
		parseAsString.withDefault("analyze"),
	);

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-2 mb-6">
				<TabsTrigger value="analyze">Analyze Audio</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
			</TabsList>

			<TabsContent value="analyze">
				<SpeakerSeparationTool />
			</TabsContent>

			<TabsContent value="history">
				<SpeakerSeparationHistory />
			</TabsContent>
		</Tabs>
	);
}
