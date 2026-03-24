import { config } from "@repo/config";
import { ToolHistoryPage } from "@saas/tools/components/ToolHistoryPage";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { notFound } from "next/navigation";

interface ToolHistoryProps {
	params: Promise<{
		toolSlug: string;
	}>;
}

export default async function ToolHistory({ params }: ToolHistoryProps) {
	const { toolSlug } = await params;

	if (!isToolEnabled(toolSlug)) {
		notFound();
	}

	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	const toolName = tool?.name ?? toolSlug;

	return <ToolHistoryPage toolSlug={toolSlug} toolName={toolName} />;
}
