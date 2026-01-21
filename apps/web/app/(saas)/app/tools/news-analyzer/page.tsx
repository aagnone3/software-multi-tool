import { config } from "@repo/config";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { notFound, redirect } from "next/navigation";
import { NewsAnalyzerWithHistory } from "../../../../../components/tools/news-analyzer/news-analyzer-with-history";

export async function generateMetadata() {
	const tool = config.tools.registry.find((t) => t.slug === "news-analyzer");

	if (!tool) {
		return {
			title: "Tool Not Found",
		};
	}

	return {
		title: tool.name,
		description: tool.description,
	};
}

export default async function NewsAnalyzerPage() {
	const tool = config.tools.registry.find(
		(t) => t.slug === "news-analyzer" && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	if (!isToolEnabled("news-analyzer")) {
		redirect("/app");
	}

	return (
		<div className="max-w-4xl">
			<NewsAnalyzerWithHistory />
		</div>
	);
}
