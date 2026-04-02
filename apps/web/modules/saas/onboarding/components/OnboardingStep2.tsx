"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	ArrowRightIcon,
	ClipboardListIcon,
	FileTextIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	SeparatorHorizontalIcon,
	WalletIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

const toolSuggestions = [
	{
		slug: "meeting-summarizer",
		icon: ClipboardListIcon,
		label: "Summarize meetings",
		desc: "Turn notes or transcripts into action items in seconds.",
	},
	{
		slug: "invoice-processor",
		icon: ReceiptIcon,
		label: "Process invoices",
		desc: "Extract vendor, amounts, and dates from PDFs automatically.",
	},
	{
		slug: "contract-analyzer",
		icon: FileTextIcon,
		label: "Analyze contracts",
		desc: "Surface key terms and risk clauses without a lawyer.",
	},
	{
		slug: "expense-categorizer",
		icon: WalletIcon,
		label: "Categorize expenses",
		desc: "Upload a spreadsheet and get expenses sorted for tax time.",
	},
	{
		slug: "feedback-analyzer",
		icon: MessageSquareTextIcon,
		label: "Analyze customer feedback",
		desc: "Spot sentiment trends and top complaints at scale.",
	},
	{
		slug: "speaker-separation",
		icon: SeparatorHorizontalIcon,
		label: "Separate speakers in audio",
		desc: "Get labeled transcripts from any interview or call.",
	},
	{
		slug: "news-analyzer",
		icon: NewspaperIcon,
		label: "Analyze news articles",
		desc: "Detect bias, sentiment, and key themes instantly.",
	},
];

export function OnboardingStep2({ onCompleted }: { onCompleted: () => void }) {
	const { track } = useProductAnalytics();
	const [selected, setSelected] = useState<string | null>(null);

	const enabledSlugs = new Set<string>(
		config.tools.registry
			.filter((t) => t.enabled)
			.map((t) => t.slug as string),
	);

	const available = toolSuggestions.filter((t) => enabledSlugs.has(t.slug));

	const firstTool =
		available.find((t) => t.slug === selected) ?? available[0];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="font-semibold text-base">
					Which tool sounds most useful to you?
				</h2>
				<p className="mt-1 text-foreground/60 text-sm">
					We'll send you there first. You can always explore all tools
					later.
				</p>
			</div>

			<div className="grid gap-2 sm:grid-cols-2">
				{available.map(({ slug, icon: Icon, label, desc }) => (
					<button
						key={slug}
						type="button"
						onClick={() => {
							setSelected(slug);
							track({
								name: "onboarding_step2_tool_selected",
								props: { tool_slug: slug },
							});
						}}
						className={cn(
							"flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
							selected === slug
								? "border-primary bg-primary/5"
								: "border-border",
						)}
					>
						<Icon className="mt-0.5 size-4 shrink-0 text-primary" />
						<div>
							<p className="font-medium text-sm">{label}</p>
							<p className="text-foreground/60 text-xs">{desc}</p>
						</div>
					</button>
				))}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				{selected && firstTool ? (
					<Button
						asChild
						onClick={() => {
							track({
								name: "onboarding_step2_completed",
								props: { tool_slug: selected, skipped: false },
							});
							onCompleted();
						}}
						className="w-full sm:w-auto"
					>
						<Link href={`/app/tools/${firstTool.slug}`}>
							<ZapIcon className="mr-2 size-4" />
							Try {firstTool.label}
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
				) : (
					<Button
						onClick={() => {
							track({
								name: "onboarding_step2_completed",
								props: { tool_slug: null, skipped: false },
							});
							onCompleted();
						}}
						className="w-full sm:w-auto"
					>
						Go to dashboard
						<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				)}
				{!selected && (
					<button
						type="button"
						onClick={() => {
							track({
								name: "onboarding_step2_skipped",
								props: {},
							});
							track({
								name: "onboarding_step2_completed",
								props: { tool_slug: null, skipped: true },
							});
							onCompleted();
						}}
						className="text-center text-foreground/50 text-xs hover:text-foreground/70"
					>
						Skip for now
					</button>
				)}
			</div>
		</div>
	);
}
