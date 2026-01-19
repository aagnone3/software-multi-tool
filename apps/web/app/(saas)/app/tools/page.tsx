import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolCard } from "@saas/tools/components/ToolCard";
import { getVisibleTools } from "@saas/tools/lib/tool-flags";

export default function ToolsPage() {
	const visibleTools = getVisibleTools();

	return (
		<div>
			<PageHeader
				title="Tools"
				subtitle="Explore our collection of AI-powered utilities"
			/>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{visibleTools.map((tool) => (
					<ToolCard
						key={tool.slug}
						tool={tool}
						isComingSoon={tool.isComingSoon}
					/>
				))}
			</div>
		</div>
	);
}
