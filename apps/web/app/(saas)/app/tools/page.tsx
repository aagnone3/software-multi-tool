import { config } from "@repo/config";
import { ToolCard } from "@saas/tools/components/ToolCard";

export default function ToolsPage() {
	const enabledTools = config.tools.registry.filter((tool) => tool.enabled);

	return (
		<div className="container max-w-6xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Tools</h1>
				<p className="mt-2 text-muted-foreground">
					Explore our collection of AI-powered utilities
				</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{enabledTools.map((tool) => (
					<ToolCard key={tool.slug} tool={tool} />
				))}
			</div>
		</div>
	);
}
