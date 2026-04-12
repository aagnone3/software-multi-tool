"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ChevronLeftIcon, ChevronRightIcon, LightbulbIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface ToolTip {
	text: string;
}

const TOOL_TIPS: Record<string, ToolTip[]> = {
	"news-analyzer": [
		{
			text: "Enter a topic or keyword to get a comprehensive news analysis with sentiment scores.",
		},
		{
			text: "Try entering company names, events, or trending topics for the best results.",
		},
		{
			text: "Results include source credibility scores — look for high-credibility sources for accuracy.",
		},
		{
			text: "Use the date range filter to focus on recent news or historical events.",
		},
	],
	"invoice-processor": [
		{
			text: "Upload PDF or image invoices — JPG, PNG, TIFF, and WebP are all supported.",
		},
		{
			text: "The AI extracts line items, totals, and vendor details automatically.",
		},
		{
			text: "Review extracted data carefully before using it in your accounting system.",
		},
		{
			text: "Multi-page PDF invoices are supported — no need to split them first.",
		},
	],
	"contract-analyzer": [
		{
			text: "Upload contracts in PDF, Word, or plain text format for analysis.",
		},
		{
			text: "The AI highlights key clauses, obligations, and potential risk areas.",
		},
		{
			text: "Use the output as a starting point — always have a legal professional review contracts.",
		},
		{
			text: "Works best with standard commercial contracts, NDAs, and service agreements.",
		},
	],
	"feedback-analyzer": [
		{
			text: "Paste multiple feedback items at once — one per line works well.",
		},
		{
			text: "The AI groups feedback into themes and identifies the most common issues.",
		},
		{
			text: "Sentiment analysis helps you prioritize which feedback to act on first.",
		},
		{
			text: "Works with product reviews, survey responses, and customer support tickets.",
		},
	],
	"expense-categorizer": [
		{
			text: "Upload CSV or Excel expense reports — standard column headers are auto-detected.",
		},
		{
			text: "The AI maps expenses to standard categories like Travel, Software, and Meals.",
		},
		{
			text: "Review and adjust any miscategorized items before exporting.",
		},
		{
			text: "Works with exports from most major expense platforms and bank statements.",
		},
	],
	"meeting-summarizer": [
		{
			text: "Upload meeting transcripts in TXT, VTT (WebVTT), or SRT subtitle format.",
		},
		{
			text: "The AI extracts action items, decisions, and key discussion points.",
		},
		{
			text: "Speaker labels in transcripts are preserved in the summary output.",
		},
		{
			text: "Works best with transcripts from Zoom, Teams, Google Meet, and Otter.ai.",
		},
	],
	"speaker-separation": [
		{ text: "Upload audio files in MP3, WAV, M4A, or FLAC format." },
		{
			text: "The AI identifies and separates different speakers automatically.",
		},
		{
			text: "Longer audio files (>30 min) may take a few minutes to process.",
		},
		{ text: "For best results, use audio with minimal background noise." },
	],
	"diagram-editor": [
		{
			text: "Describe a system, flow, or architecture in natural language to generate a diagram.",
		},
		{
			text: "Use Mermaid syntax in the editor for full control over diagram structure.",
		},
		{
			text: "Supported diagram types include flowcharts, sequence, class, and ER diagrams.",
		},
		{
			text: "Export diagrams as SVG or PNG for use in docs and presentations.",
		},
	],
};

const DEFAULT_TIPS: ToolTip[] = [
	{
		text: "Start by providing clear, specific input for the best AI results.",
	},
	{
		text: "Results are processed asynchronously — check your jobs history for completed outputs.",
	},
	{ text: "Each tool run uses credits from your account balance." },
];

interface ToolTipsBannerProps {
	toolSlug: string;
	className?: string;
}

export function ToolTipsBanner({ toolSlug, className }: ToolTipsBannerProps) {
	const tips = TOOL_TIPS[toolSlug] ?? DEFAULT_TIPS;
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const { track } = useProductAnalytics();

	const storageKey = `tips-dismissed-${toolSlug}`;

	useEffect(() => {
		try {
			if (localStorage.getItem(storageKey) === "true") {
				setIsVisible(false);
			}
		} catch {
			// ignore
		}
	}, [storageKey]);

	// Auto-rotate tips every 8 seconds
	useEffect(() => {
		if (!isVisible || tips.length <= 1) { return; }
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % tips.length);
		}, 8000);
		return () => clearInterval(interval);
	}, [isVisible, tips.length]);

	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => {
			const next = (prev - 1 + tips.length) % tips.length;
			track({
				name: "tool_tip_navigated",
				props: {
					tool_slug: toolSlug,
					direction: "prev",
					tip_index: next,
				},
			});
			return next;
		});
	}, [tips.length, toolSlug, track]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => {
			const next = (prev + 1) % tips.length;
			track({
				name: "tool_tip_navigated",
				props: {
					tool_slug: toolSlug,
					direction: "next",
					tip_index: next,
				},
			});
			return next;
		});
	}, [tips.length, toolSlug, track]);

	if (!isVisible) { return null; }

	const tip = tips[currentIndex];

	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3",
				"dark:border-yellow-800/50 dark:bg-yellow-950/30",
				className,
			)}
		>
			<LightbulbIcon className="size-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
			<p className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
				<span className="font-medium">Tip: </span>
				{tip.text}
			</p>
			{tips.length > 1 && (
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-6 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
						onClick={handlePrev}
						aria-label="Previous tip"
					>
						<ChevronLeftIcon className="size-3" />
					</Button>
					<span className="text-xs text-yellow-600 dark:text-yellow-400">
						{currentIndex + 1}/{tips.length}
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="size-6 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
						onClick={handleNext}
						aria-label="Next tip"
					>
						<ChevronRightIcon className="size-3" />
					</Button>
				</div>
			)}
		</div>
	);
}
