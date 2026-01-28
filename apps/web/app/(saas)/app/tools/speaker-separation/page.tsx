import { config } from "@repo/config";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { notFound, redirect } from "next/navigation";
import { SpeakerSeparationWithHistory } from "../../../../../components/tools/speaker-separation";

export async function generateMetadata() {
	const tool = config.tools.registry.find(
		(t) => t.slug === "speaker-separation",
	);

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

export default async function SpeakerSeparationPage() {
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
			<SpeakerSeparationWithHistory />
		</div>
	);
}
