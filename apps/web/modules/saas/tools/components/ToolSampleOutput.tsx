"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { cn } from "@ui/lib";
import { ChevronDownIcon, ChevronUpIcon, FlaskConicalIcon } from "lucide-react";
import React, { useState } from "react";

interface SampleOutput {
	label: string;
	input: string;
	output: string | Record<string, unknown>;
}

const SAMPLES: Record<string, SampleOutput> = {
	"news-analyzer": {
		label: "News Article",
		input: "Tech giant announces record profits amid antitrust scrutiny. The company posted $42B in quarterly earnings while regulators in three countries continue investigations into monopolistic practices.",
		output: {
			sentiment: "mixed",
			bias: "neutral-business",
			keyThemes: [
				"corporate earnings",
				"regulatory pressure",
				"antitrust",
			],
			summary:
				"Record profits reported alongside ongoing global regulatory investigations.",
			credibilityScore: 78,
		},
	},
	"contract-analyzer": {
		label: "Service Agreement",
		input: 'This Agreement shall remain in effect for a period of 12 months ("Term"), with automatic renewal unless terminated by either party with 30 days written notice. Liability shall be limited to fees paid in the prior 3 months.',
		output: {
			contractType: "Service Agreement",
			duration: "12 months, auto-renewing",
			terminationNotice: "30 days written notice",
			liabilityCap: "3 months of fees paid",
			keyRisks: ["Auto-renewal could incur unexpected charges"],
			overallRisk: "low",
		},
	},
	"invoice-processor": {
		label: "Invoice",
		input: "Invoice #2024-089\nVendor: Acme Supplies Ltd\nDate: March 15, 2024\nLine items: Office Supplies $450.00, Printer Paper (5 reams) $75.00\nSubtotal: $525.00, Tax (8%): $42.00\nTotal Due: $567.00",
		output: {
			invoiceNumber: "2024-089",
			vendor: "Acme Supplies Ltd",
			date: "2024-03-15",
			lineItems: [
				{ description: "Office Supplies", amount: 450.0 },
				{ description: "Printer Paper (5 reams)", amount: 75.0 },
			],
			subtotal: 525.0,
			tax: 42.0,
			total: 567.0,
		},
	},
	"meeting-summarizer": {
		label: "Meeting Notes",
		input: "Q1 planning call — Sarah: we need to finalize the budget. Tom: marketing needs $50k for the campaign. Sarah: approved, let's target Feb launch. Tom: will coordinate with design by Jan 15.",
		output: {
			summary: "Q1 planning call to finalize budget and campaign timing.",
			decisions: [
				"Marketing budget of $50k approved for campaign",
				"Target launch date: February",
			],
			actionItems: [
				{
					owner: "Tom",
					task: "Coordinate with design team",
					deadline: "Jan 15",
				},
			],
			participants: ["Sarah", "Tom"],
		},
	},
	"feedback-analyzer": {
		label: "Customer Reviews",
		input: "Review 1: Love the speed but the UI is confusing. Review 2: Excellent customer support, resolved my issue in minutes. Review 3: Price is too high for what you get. Review 4: The new update broke my workflow.",
		output: {
			overallSentiment: "mixed",
			sentimentBreakdown: { positive: 40, negative: 40, neutral: 20 },
			topPraises: ["fast speed", "responsive customer support"],
			topComplaints: ["confusing UI", "pricing", "update regression"],
			actionableInsights: [
				"Improve onboarding to reduce UI confusion",
				"Review pricing relative to perceived value",
				"Implement regression testing before updates",
			],
		},
	},
	"expense-categorizer": {
		label: "Expense CSV",
		input: "Date, Merchant, Amount\n2024-03-01, Starbucks, 12.50\n2024-03-02, AWS, 340.00\n2024-03-03, Delta Airlines, 450.00\n2024-03-04, Office Depot, 89.00",
		output: {
			totalExpenses: 891.5,
			categories: {
				"Meals & Entertainment": 12.5,
				"Software & Cloud": 340.0,
				Travel: 450.0,
				"Office Supplies": 89.0,
			},
			expenseCount: 4,
			largestExpense: { merchant: "Delta Airlines", amount: 450.0 },
		},
	},
	"speaker-separation": {
		label: "Audio Transcript",
		input: "[Audio file: team_meeting_march.mp3 — 8:32 duration, 3 speakers]",
		output: {
			speakers: 3,
			transcript: [
				{
					speaker: "Speaker A",
					start: "00:00",
					end: "00:45",
					text: "Let's get started. Can everyone confirm they're ready?",
				},
				{
					speaker: "Speaker B",
					start: "00:46",
					end: "01:10",
					text: "Ready here. I have the slides loaded.",
				},
				{
					speaker: "Speaker C",
					start: "01:11",
					end: "01:30",
					text: "Go ahead, I'm listening.",
				},
			],
			totalDuration: "8:32",
			wordCount: 1240,
		},
	},
};

interface ToolSampleOutputProps {
	toolSlug: string;
	className?: string;
}

export function ToolSampleOutput({
	toolSlug,
	className,
}: ToolSampleOutputProps) {
	const [expanded, setExpanded] = useState(false);
	const sample = SAMPLES[toolSlug];

	if (!sample) return null;

	const outputStr =
		typeof sample.output === "string"
			? sample.output
			: JSON.stringify(sample.output, null, 2);

	return (
		<Card className={cn("mt-4", className)}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlaskConicalIcon className="size-4 text-muted-foreground" />
						<CardTitle className="text-base font-medium">
							Sample Output
						</CardTitle>
						<Badge className="text-xs border border-border bg-transparent text-foreground">
							{sample.label}
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setExpanded((v) => !v)}
						aria-expanded={expanded}
						aria-label={
							expanded ? "Collapse sample" : "Expand sample"
						}
					>
						{expanded ? (
							<ChevronUpIcon className="size-4" />
						) : (
							<ChevronDownIcon className="size-4" />
						)}
						{expanded ? "Hide" : "Preview"}
					</Button>
				</div>
				<CardDescription className="text-xs">
					See what this tool produces before spending credits.
				</CardDescription>
			</CardHeader>

			{expanded && (
				<CardContent className="space-y-4 pt-0">
					{/* Input */}
					<div>
						<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
							Sample Input
						</p>
						<div className="rounded-lg bg-muted px-4 py-3">
							<pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
								{sample.input}
							</pre>
						</div>
					</div>

					{/* Output */}
					<div>
						<p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
							Sample Output
						</p>
						<div className="rounded-lg bg-primary/5 px-4 py-3">
							<pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
								{outputStr}
							</pre>
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	);
}
