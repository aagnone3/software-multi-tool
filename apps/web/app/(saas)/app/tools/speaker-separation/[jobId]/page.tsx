import { config } from "@repo/config";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { notFound, redirect } from "next/navigation";
import { SpeakerSeparationDetail } from "../../../../../../components/tools/speaker-separation";

interface SpeakerSeparationDetailPageProps {
	params: Promise<{
		jobId: string;
	}>;
}

export async function generateMetadata() {
	const tool = config.tools.registry.find(
		(t) => t.slug === "speaker-separation",
	);

	return {
		title: tool ? `Analysis Details - ${tool.name}` : "Analysis Details",
		description: "View detailed speaker separation analysis results",
	};
}

export default async function SpeakerSeparationDetailPage({
	params,
}: SpeakerSeparationDetailPageProps) {
	const { jobId } = await params;

	const tool = config.tools.registry.find(
		(t) => t.slug === "speaker-separation" && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	if (!isToolEnabled("speaker-separation")) {
		redirect("/app");
	}

	return (
		<div className="max-w-4xl">
			<SpeakerSeparationDetail jobId={jobId} />
		</div>
	);
}
