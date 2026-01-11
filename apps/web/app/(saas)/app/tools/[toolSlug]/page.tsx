import { config } from "@repo/config";
import { ContractAnalyzerTool } from "@tools/components/ContractAnalyzerTool";
import { ExpenseCategorizerTool } from "@tools/components/ExpenseCategorizerTool";
import { FeedbackAnalyzerTool } from "@tools/components/FeedbackAnalyzerTool";
import { InvoiceProcessorTool } from "@tools/components/InvoiceProcessorTool";
import { MeetingSummarizerTool } from "@tools/components/MeetingSummarizerTool";
import { notFound } from "next/navigation";
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
	};
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
	"news-analyzer": NewsAnalyzer,
	"invoice-processor": InvoiceProcessorTool,
	"contract-analyzer": ContractAnalyzerTool,
	"feedback-analyzer": FeedbackAnalyzerTool,
	"expense-categorizer": ExpenseCategorizerTool,
	"meeting-summarizer": MeetingSummarizerTool,
};

export default async function ToolPage({ params }: ToolPageProps) {
	const { toolSlug } = await params;
	const tool = config.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	const ToolComponent = TOOL_COMPONENTS[toolSlug];

	if (!ToolComponent) {
		return (
			<div className="max-w-4xl">
				<div className="rounded-2xl border bg-card p-8">
					<h1 className="text-2xl font-bold">{tool.name}</h1>
					<p className="mt-2 text-muted-foreground">
						{tool.description}
					</p>

					<div className="mt-8 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-12 text-center">
						<p className="text-muted-foreground">
							This tool is under development. Check back soon!
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl">
			<ToolComponent />
		</div>
	);
}
