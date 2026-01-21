import { config } from "@repo/config";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { notFound, redirect } from "next/navigation";
import { NewsAnalyzerDetail } from "../../../../../../components/tools/news-analyzer/news-analyzer-detail";

interface NewsAnalyzerDetailPageProps {
	params: Promise<{
		jobId: string;
	}>;
}

export async function generateMetadata() {
	const tool = config.tools.registry.find((t) => t.slug === "news-analyzer");

	return {
		title: tool ? `Analysis Details - ${tool.name}` : "Analysis Details",
		description: "View detailed news analysis results",
	};
}

export default async function NewsAnalyzerDetailPage({
	params,
}: NewsAnalyzerDetailPageProps) {
	const { jobId } = await params;

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
			<NewsAnalyzerDetail jobId={jobId} />
		</div>
	);
}
