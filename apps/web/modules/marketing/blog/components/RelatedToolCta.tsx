"use client";

import { Button } from "@ui/components/button";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

type RelatedTool = {
	slug: string;
	name: string;
	description: string;
	ctaText: string;
};

const TAG_TO_TOOL: Record<string, RelatedTool> = {
	contracts: {
		slug: "contract-analyzer",
		name: "Contract Analyzer",
		description:
			"Surface key terms, risky clauses, and obligations from contracts without expensive legal review.",
		ctaText: "Analyze a Contract Free",
	},
	legal: {
		slug: "contract-analyzer",
		name: "Contract Analyzer",
		description:
			"Surface key terms, risky clauses, and obligations from contracts without expensive legal review.",
		ctaText: "Analyze a Contract Free",
	},
	invoices: {
		slug: "invoice-processor",
		name: "Invoice Processor",
		description:
			"Automatically extract vendor, amount, and line items from invoices in PDF or image format.",
		ctaText: "Process an Invoice Free",
	},
	finance: {
		slug: "expense-categorizer",
		name: "Expense Categorizer",
		description:
			"Auto-categorize expenses from CSV or XLSX bank exports with budget summaries and overspend alerts.",
		ctaText: "Categorize Expenses Free",
	},
	expenses: {
		slug: "expense-categorizer",
		name: "Expense Categorizer",
		description:
			"Auto-categorize expenses from CSV or XLSX bank exports with budget summaries and overspend alerts.",
		ctaText: "Categorize Expenses Free",
	},
	meetings: {
		slug: "meeting-summarizer",
		name: "Meeting Summarizer",
		description:
			"Turn raw meeting notes or transcripts into structured summaries with action items and decisions.",
		ctaText: "Summarize a Meeting Free",
	},
	productivity: {
		slug: "meeting-summarizer",
		name: "Meeting Summarizer",
		description:
			"Turn raw meeting notes or transcripts into structured summaries with action items and decisions.",
		ctaText: "Summarize a Meeting Free",
	},
	feedback: {
		slug: "feedback-analyzer",
		name: "Feedback Analyzer",
		description:
			"Classify sentiment, extract themes, and prioritize issues from customer or employee feedback.",
		ctaText: "Analyze Feedback Free",
	},
	audio: {
		slug: "speaker-separation",
		name: "Speaker Separation",
		description:
			"Identify and separate speakers in audio files with timestamped transcripts per speaker.",
		ctaText: "Try Speaker Separation Free",
	},
	news: {
		slug: "news-analyzer",
		name: "News Analyzer",
		description:
			"Detect media bias and extract key themes from news articles. Ideal for research and marketing teams.",
		ctaText: "Analyze News Articles Free",
	},
};

function getToolFromTags(tags: string[]): RelatedTool | null {
	for (const tag of tags) {
		const tool = TAG_TO_TOOL[tag.toLowerCase()];
		if (tool) return tool;
	}
	return null;
}

type Props = {
	tags?: string[];
};

export function RelatedToolCta({ tags = [] }: Props) {
	const tool = getToolFromTags(tags);
	if (!tool) return null;

	return (
		<div className="my-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
			<div className="flex items-start gap-4">
				<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<SparklesIcon className="h-5 w-5 text-primary" />
				</div>
				<div className="flex-1">
					<p className="mb-1 font-semibold text-foreground text-sm uppercase tracking-wider">
						Try it yourself
					</p>
					<h3 className="mb-2 font-bold text-xl">{tool.name}</h3>
					<p className="mb-4 text-muted-foreground text-sm leading-relaxed">
						{tool.description}
					</p>
					<div className="flex flex-wrap gap-3">
						<Button asChild size="sm">
							<Link
								href={`/auth/signup?redirect=/app/tools/${tool.slug}`}
							>
								{tool.ctaText}
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link href={`/tools/${tool.slug}`}>Learn more</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
