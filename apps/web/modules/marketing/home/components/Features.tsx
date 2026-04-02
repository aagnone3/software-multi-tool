"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import {
	ClipboardListIcon,
	FileTextIcon,
	ImageMinusIcon,
	type LucideIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	SeparatorHorizontalIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback } from "react";

interface Tool {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
	href: string;
	comingSoon?: boolean;
}

const tools: Tool[] = [
	{
		id: "news-analyzer",
		title: "News Analyzer",
		description:
			"Analyze news articles for bias, sentiment, and key themes. Understand what's really being said beneath the headlines.",
		icon: NewspaperIcon,
		href: "/app/tools/news-analyzer",
	},
	{
		id: "contract-analyzer",
		title: "Contract Analyzer",
		description:
			"Upload any contract and instantly surface key terms, risk clauses, and obligations. No legal degree required.",
		icon: FileTextIcon,
		href: "/app/tools/contract-analyzer",
	},
	{
		id: "invoice-processor",
		title: "Invoice Processor",
		description:
			"Extract vendor, amount, line items, and dates from invoices automatically. Export clean data for your accounting workflow.",
		icon: ReceiptIcon,
		href: "/app/tools/invoice-processor",
	},
	{
		id: "meeting-summarizer",
		title: "Meeting Summarizer",
		description:
			"Paste meeting notes or upload a transcript and get a structured summary with action items and key decisions.",
		icon: ClipboardListIcon,
		href: "/app/tools/meeting-summarizer",
	},
	{
		id: "feedback-analyzer",
		title: "Customer Feedback Analyzer",
		description:
			"Analyze reviews and survey responses at scale. Surface sentiment trends, top complaints, and praise patterns.",
		icon: MessageSquareTextIcon,
		href: "/app/tools/feedback-analyzer",
	},
	{
		id: "expense-categorizer",
		title: "Expense Categorizer",
		description:
			"Upload a CSV or spreadsheet of expenses and get them automatically categorized for tax or accounting purposes.",
		icon: WalletIcon,
		href: "/app/tools/expense-categorizer",
	},
	{
		id: "speaker-separation",
		title: "Speaker Separation",
		description:
			"Upload an audio file and identify who said what, with timestamps and a full diarized transcript.",
		icon: SeparatorHorizontalIcon,
		href: "/app/tools/speaker-separation",
	},
	{
		id: "bg-remover",
		title: "Background Remover",
		description:
			"Remove image backgrounds instantly with AI. Perfect for product photos, headshots, and marketing assets.",
		icon: ImageMinusIcon,
		href: "/app/tools/bg-remover",
		comingSoon: true,
	},
];

export function Features() {
	const { track } = useProductAnalytics();

	const handleToolClick = useCallback(
		(tool: Tool) => {
			track({
				name: "home_features_tool_clicked",
				props: { tool_id: tool.id, tool_title: tool.title },
			});
		},
		[track],
	);

	return (
		<section
			id="features"
			className="scroll-my-20 bg-muted/30 py-16 lg:py-24"
		>
			<div className="container max-w-6xl">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-bold text-3xl md:text-4xl lg:text-5xl">
						8 AI tools, ready to use today
					</h2>
					<p className="mt-4 text-balance text-foreground/70 text-lg">
						No prompts to engineer. No APIs to wire up. Just upload,
						click, and get results.
					</p>
				</div>

				<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8">
					{tools.map((tool) => (
						<div
							key={tool.id}
							className="group relative rounded-2xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
						>
							{tool.comingSoon && (
								<span className="absolute top-4 right-4 rounded-full bg-muted px-2 py-0.5 text-foreground/50 text-xs">
									Soon
								</span>
							)}
							<div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
								<tool.icon className="size-6" />
							</div>
							<h3 className="font-semibold text-lg">
								{tool.title}
							</h3>
							<p className="mt-2 text-foreground/70 text-sm leading-relaxed">
								{tool.description}
							</p>
							{!tool.comingSoon && (
								<Link
									href={tool.href}
									className="mt-4 inline-block text-primary text-sm hover:underline"
									onClick={() => handleToolClick(tool)}
								>
									Try it →
								</Link>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
