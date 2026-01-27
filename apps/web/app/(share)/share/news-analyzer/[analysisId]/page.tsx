import { config } from "@repo/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedNewsAnalysis } from "./shared-news-analysis";

interface SharedNewsAnalysisPageProps {
	params: Promise<{
		analysisId: string;
	}>;
}

export async function generateMetadata(
	_props: SharedNewsAnalysisPageProps,
): Promise<Metadata> {
	// Note: We could fetch the analysis here to show the actual title in metadata
	// but for now we use a generic title since this is a public share page
	return {
		title: `News Analysis | ${config.appName}`,
		description: `View this AI-powered news analysis on ${config.appName}`,
		openGraph: {
			title: `News Analysis | ${config.appName}`,
			description: `View this AI-powered news analysis on ${config.appName}`,
			type: "article",
		},
		twitter: {
			card: "summary_large_image",
			title: `News Analysis | ${config.appName}`,
			description: `View this AI-powered news analysis on ${config.appName}`,
		},
	};
}

export default async function SharedNewsAnalysisPage({
	params,
}: SharedNewsAnalysisPageProps) {
	const { analysisId } = await params;

	if (!analysisId) {
		notFound();
	}

	return <SharedNewsAnalysis analysisId={analysisId} />;
}
