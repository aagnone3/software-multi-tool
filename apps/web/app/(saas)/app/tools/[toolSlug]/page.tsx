import { config } from "@repo/config";
import { BgRemoverClient } from "@saas/tools/bg-remover/BgRemoverClient";
import { notFound } from "next/navigation";

interface ToolPageProps {
	params: Promise<{
		toolSlug: string;
	}>;
}

export async function generateStaticParams() {
	return config.tools.registry
		.filter((tool) => tool.enabled)
		.map((tool) => ({
			toolSlug: tool.slug,
		}));
}

export async function generateMetadata({ params }: ToolPageProps) {
	const { toolSlug } = await params;
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);

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

export default async function ToolPage({ params }: ToolPageProps) {
	const { toolSlug } = await params;
	const tool = config.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	// Render tool-specific component
	if (toolSlug === "bg-remover") {
		return <BgRemoverClient />;
	}

	// Default: Under development
	return (
		<div className="container max-w-4xl px-4 py-8">
			<div className="rounded-2xl border bg-card p-8">
				<h1 className="text-2xl font-bold">{tool.name}</h1>
				<p className="mt-2 text-muted-foreground">{tool.description}</p>

				<div className="mt-8 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-12 text-center">
					<p className="text-muted-foreground">
						This tool is under development. Check back soon!
					</p>
				</div>
			</div>
		</div>
	);
}
