"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
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
				<NewsAnalyzerHistory />
			</TabsContent>
		</Tabs>
	);
}
