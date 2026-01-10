import { config } from "@repo/config";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolCard } from "@saas/tools/components/ToolCard";

export default function ToolsPage() {
	const enabledTools = config.tools.registry.filter((tool) => tool.enabled);

	return (
		<div>
			<PageHeader
				title="Tools"
				subtitle="Explore our collection of AI-powered utilities"
			/>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{enabledTools.map((tool) => (
					<ToolCard key={tool.slug} tool={tool} />
				))}
			</div>
		</div>
	);
}
