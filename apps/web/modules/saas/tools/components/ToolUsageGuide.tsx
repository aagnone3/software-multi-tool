"use client";

import { Button } from "@ui/components/button";
import { ChevronDownIcon, InfoIcon } from "lucide-react";
import React, { useState } from "react";

interface ToolUsageTip {
	title: string;
	description: string;
}

interface ToolUsageGuideProps {
	toolSlug: string;
}

const TOOL_USAGE_GUIDES: Record<
	string,
	{ overview: string; tips: ToolUsageTip[] }
> = {
	"news-analyzer": {
		overview:
			"Analyze news articles to extract key facts, sentiment, and summaries.",
		tips: [
			{
				title: "Enter article text or URL",
				description:
					"Paste the full article text or provide a URL for automatic extraction.",
			},
			{
				title: "Review extracted entities",
				description:
					"The tool identifies key people, organizations, and locations mentioned in the article.",
			},
			{
				title: "Check sentiment scores",
				description:
					"Sentiment is scored from -1 (negative) to +1 (positive) for the overall article and key topics.",
			},
		],
	},
	"invoice-processor": {
		overview:
			"Extract structured data from invoice documents automatically.",
		tips: [
			{
				title: "Upload a clear document",
				description:
					"PDF, PNG, JPG, or TIFF files work best. Ensure text is legible for accurate extraction.",
			},
			{
				title: "Supported invoice types",
				description:
					"Works with vendor invoices, utility bills, receipts, and purchase orders.",
			},
			{
				title: "Review extracted fields",
				description:
					"Verify the extracted vendor name, invoice number, date, line items, and totals after processing.",
			},
		],
	},
	"contract-analyzer": {
		overview: "Identify key clauses, risks, and obligations in contracts.",
		tips: [
			{
				title: "Paste contract text or upload a file",
				description:
					"Supports plain text input or PDF/Word document uploads.",
			},
			{
				title: "Select analysis type",
				description:
					"Choose from risk analysis, obligation extraction, or full clause breakdown depending on your needs.",
			},
			{
				title: "Review flagged clauses",
				description:
					"Pay attention to clauses flagged as high-risk — they typically require legal review.",
			},
		],
	},
	"feedback-analyzer": {
		overview: "Categorize and score customer feedback at scale.",
		tips: [
			{
				title: "Input feedback text",
				description:
					"Paste individual feedback or a batch of responses, one per line.",
			},
			{
				title: "Results include sentiment and category",
				description:
					"Each feedback item is scored for sentiment and assigned a category like Product, Support, or Billing.",
			},
			{
				title: "Export results",
				description:
					"Download the structured results as CSV for use in spreadsheets or reporting tools.",
			},
		],
	},
	"expense-categorizer": {
		overview:
			"Categorize expense line items from receipts and spreadsheets.",
		tips: [
			{
				title: "Upload a CSV or Excel file",
				description:
					"The tool expects a file with description and amount columns. Column headers are auto-detected.",
			},
			{
				title: "Categories are customizable",
				description:
					"Default categories include Travel, Meals, Software, and Office. Custom categories can be added.",
			},
			{
				title: "Review uncategorized items",
				description:
					"Items that couldn't be matched automatically are flagged for manual review.",
			},
		],
	},
	"meeting-summarizer": {
		overview: "Summarize meeting transcripts and extract action items.",
		tips: [
			{
				title: "Paste your transcript",
				description:
					"Supports plain text transcripts from Zoom, Teams, or any meeting platform.",
			},
			{
				title: "Action items are extracted automatically",
				description:
					"The tool identifies tasks, owners, and deadlines mentioned in the meeting.",
			},
			{
				title: "Summary length options",
				description:
					"Choose brief (1-2 paragraphs) or detailed (full breakdown by topic) summaries.",
			},
		],
	},
	"speaker-separation": {
		overview: "Separate and label speakers in audio recordings.",
		tips: [
			{
				title: "Upload an audio file",
				description:
					"Supports MP3, WAV, M4A, and OGG. Clearer audio yields more accurate speaker separation.",
			},
			{
				title: "Specify number of speakers (optional)",
				description:
					"Providing the expected speaker count improves accuracy, especially for 2-person conversations.",
			},
			{
				title: "Review and edit speaker labels",
				description:
					"After processing, rename speakers from Speaker 1 / Speaker 2 to actual names.",
			},
		],
	},
	"diagram-editor": {
		overview:
			"Create and edit diagrams using natural language or Mermaid syntax.",
		tips: [
			{
				title: "Describe your diagram in plain English",
				description:
					"Type what you want to diagram and the AI will generate the Mermaid code for you.",
			},
			{
				title: "Edit the generated code directly",
				description:
					"Switch to the code editor to fine-tune the diagram using Mermaid syntax.",
			},
			{
				title: "Supported diagram types",
				description:
					"Flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts, and more.",
			},
		],
	},
};

export function ToolUsageGuide({ toolSlug }: ToolUsageGuideProps) {
	const [isOpen, setIsOpen] = useState(false);
	const guide = TOOL_USAGE_GUIDES[toolSlug];

	if (!guide) {
		return null;
	}

	return (
		<div className="mb-6">
			<Button
				variant="ghost"
				size="sm"
				className="gap-2 px-0 text-muted-foreground hover:text-foreground"
				onClick={() => setIsOpen((prev) => !prev)}
			>
				<InfoIcon className="size-4" />
				<span>How to use this tool</span>
				<ChevronDownIcon
					className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</Button>

			{isOpen && (
				<div className="mt-3 rounded-lg border bg-muted/30 p-4">
					<p className="mb-3 text-sm text-muted-foreground">
						{guide.overview}
					</p>
					<ol className="space-y-2">
						{guide.tips.map((tip, index) => (
							<li key={tip.title} className="flex gap-3 text-sm">
								<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
									{index + 1}
								</span>
								<div>
									<span className="font-medium">
										{tip.title}
									</span>
									<span className="text-muted-foreground">
										{" — "}
										{tip.description}
									</span>
								</div>
							</li>
						))}
					</ol>
				</div>
			)}
		</div>
	);
}
