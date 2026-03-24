import { config } from "@repo/config";
import { LowCreditsWarning } from "@saas/credits/components/LowCreditsWarning";
import { RelatedToolsWidget } from "@saas/tools/components/RelatedToolsWidget";
import { ToolCollectionsPanel } from "@saas/tools/components/ToolCollectionsPanel";
import { ToolInputTemplates } from "@saas/tools/components/ToolInputTemplates";
import { ToolPageHeader } from "@saas/tools/components/ToolPageHeader";
import { ToolPersonalStats } from "@saas/tools/components/ToolPersonalStats";
import { ToolRatingWidget } from "@saas/tools/components/ToolRatingWidget";
import { ToolRecentRuns } from "@saas/tools/components/ToolRecentRuns";
import { ToolSampleOutput } from "@saas/tools/components/ToolSampleOutput";
import { ToolScheduler } from "@saas/tools/components/ToolScheduler";
import { ToolTipsBanner } from "@saas/tools/components/ToolTipsBanner";
import { ToolUsageGuide } from "@saas/tools/components/ToolUsageGuide";
import { ToolViewTracker } from "@saas/tools/components/ToolViewTracker";
import { isToolEnabled } from "@saas/tools/lib/tool-flags";
import { ContractAnalyzerTool } from "@tools/components/ContractAnalyzerTool";
import { ExpenseCategorizerTool } from "@tools/components/ExpenseCategorizerTool";
import { FeedbackAnalyzerTool } from "@tools/components/FeedbackAnalyzerTool";
import { InvoiceProcessorTool } from "@tools/components/InvoiceProcessorTool";
import { MeetingSummarizerTool } from "@tools/components/MeetingSummarizerTool";
import { SpeakerSeparationTool } from "@tools/components/SpeakerSeparationTool";
import { ToolNotes } from "@tools/components/ToolNotes";
import { notFound, redirect } from "next/navigation";
import { DiagramEditor } from "../../../../../components/tools/diagram-editor";
import { NewsAnalyzer } from "../../../../../components/tools/news-analyzer";

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
		openGraph: {
			title: `${tool.name} | ${config.appName}`,
			description: tool.description,
		},
		twitter: {
			card: "summary",
			title: `${tool.name} | ${config.appName}`,
			description: tool.description,
		},
	};
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
	"news-analyzer": NewsAnalyzer,
	"invoice-processor": InvoiceProcessorTool,
	"contract-analyzer": ContractAnalyzerTool,
	"feedback-analyzer": FeedbackAnalyzerTool,
	"expense-categorizer": ExpenseCategorizerTool,
	"meeting-summarizer": MeetingSummarizerTool,
	"speaker-separation": SpeakerSeparationTool,
	"diagram-editor": DiagramEditor,
};

// Tools with dedicated routes (not handled by this generic page)
const DEDICATED_ROUTE_TOOLS = new Set(["news-analyzer", "speaker-separation"]);

export default async function ToolPage({ params }: ToolPageProps) {
	const { toolSlug } = await params;

	const siteUrl =
		process.env.NEXT_PUBLIC_SITE_URL ?? "https://softwaremultitool.com";
	const toolMeta = config.tools.registry.find((t) => t.slug === toolSlug);
	const toolJsonLd = toolMeta
		? {
				"@context": "https://schema.org",
				"@type": "SoftwareApplication",
				name: toolMeta.name,
				description: toolMeta.description,
				applicationCategory: "BusinessApplication",
				operatingSystem: "Web",
				url: `${siteUrl}/app/tools/${toolSlug}`,
				offers: {
					"@type": "Offer",
					price: toolMeta.creditCost,
					priceCurrency: "CREDITS",
					description: `${toolMeta.creditCost} credits per use`,
				},
			}
		: null;

	// Tools with dedicated routes should use their specific routes
	if (DEDICATED_ROUTE_TOOLS.has(toolSlug)) {
		redirect(`/app/tools/${toolSlug}`);
	}

	// First check if tool exists in config
	const tool = config.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	// Check if tool is enabled via ENABLED_TOOLS env var
	// If not enabled, redirect to dashboard
	if (!isToolEnabled(toolSlug)) {
		redirect("/app");
	}

	const ToolComponent = TOOL_COMPONENTS[toolSlug];

	if (!ToolComponent) {
		return (
			<div className="max-w-4xl">
				<ToolPageHeader tool={tool} />
				<LowCreditsWarning className="mb-4" showActionButtons={true} />
				<ToolUsageGuide toolSlug={toolSlug} />
				<div className="rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/50 p-12 text-center">
					<p className="text-muted-foreground">
						This tool is under development. Check back soon!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl">
			{toolJsonLd && (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(toolJsonLd),
					}}
				/>
			)}
			<ToolViewTracker toolSlug={toolSlug} />
			<ToolPageHeader tool={tool} />
			<ToolScheduler
				toolSlug={toolSlug}
				toolName={tool.name}
				className="mb-4"
			/>
			<LowCreditsWarning className="mb-4" showActionButtons={true} />
			<ToolTipsBanner toolSlug={toolSlug} className="mb-4" />
			<ToolPersonalStats toolSlug={toolSlug} className="mb-4" />
			<ToolUsageGuide toolSlug={toolSlug} />
			<ToolComponent />
			<ToolRecentRuns toolSlug={toolSlug} className="mt-6" />
			<ToolSampleOutput toolSlug={toolSlug} className="mt-6" />
			<ToolRatingWidget toolSlug={toolSlug} className="mt-6" />
			<ToolNotes toolSlug={toolSlug} className="mt-6" />
			<ToolCollectionsPanel
				currentToolSlug={toolSlug}
				className="mt-6 rounded-lg border p-4"
			/>
			<ToolInputTemplates toolSlug={toolSlug} className="mt-6" />
			<RelatedToolsWidget currentToolSlug={toolSlug} className="mt-6" />
		</div>
	);
}
