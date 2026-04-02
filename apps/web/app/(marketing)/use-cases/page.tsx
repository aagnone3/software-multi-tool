"use client";

import { UseCasesPageTracker } from "@marketing/shared/components/UseCasesPageTracker";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

const useCases = [
	{
		category: "Legal & Compliance",
		icon: "⚖️",
		title: "Contract Review & Analysis",
		description:
			"Automatically extract key clauses, identify risks, and summarize obligations from any contract — in seconds instead of hours.",
		tool: "Contract Analyzer",
		toolSlug: "contract-analyzer",
		benefits: [
			"Spot risky clauses before you sign",
			"Extract payment terms, deadlines, and obligations",
			"Compare contracts side-by-side",
			"Flag unusual or non-standard language",
		],
		audiences: ["Small Business Owners", "Freelancers", "Startup Founders"],
	},
	{
		category: "Finance & Accounting",
		icon: "💰",
		title: "Invoice & Receipt Processing",
		description:
			"Upload stacks of invoices and receipts — the AI extracts totals, vendors, dates, and line items so your bookkeeper doesn't have to.",
		tool: "Invoice Processor",
		toolSlug: "invoice-processor",
		benefits: [
			"Extract data from PDFs and images automatically",
			"Eliminate manual data entry",
			"Catch duplicate invoices",
			"Integrate with your accounting workflow",
		],
		audiences: ["Accountants", "Operations Managers", "Business Owners"],
	},
	{
		category: "Finance & Accounting",
		icon: "🧾",
		title: "Expense Report Automation",
		description:
			"Upload expense spreadsheets and CSV files — the AI categorizes every line item, flags anomalies, and produces clean summaries.",
		tool: "Expense Categorizer",
		toolSlug: "expense-categorizer",
		benefits: [
			"Auto-categorize expenses by type",
			"Spot budget overruns and outliers",
			"Summarize spending by category",
			"Export clean reports for your accountant",
		],
		audiences: ["Finance Teams", "Remote Teams", "Managers"],
	},
	{
		category: "Meetings & Productivity",
		icon: "📝",
		title: "Meeting Summarization",
		description:
			"Turn raw meeting transcripts or audio recordings into structured summaries with action items, decisions, and key points.",
		tool: "Meeting Summarizer",
		toolSlug: "meeting-summarizer",
		benefits: [
			"Never lose a decision from a meeting",
			"Auto-generate action item lists",
			"Share concise summaries with absent team members",
			"Works with Zoom, Teams, and Google Meet transcripts",
		],
		audiences: ["Team Leads", "Project Managers", "Remote Workers"],
	},
	{
		category: "Meetings & Productivity",
		icon: "🎙️",
		title: "Multi-Speaker Audio Transcription",
		description:
			"Automatically separate and label speakers from recorded meetings, podcasts, or interviews — so you know exactly who said what.",
		tool: "Speaker Separation",
		toolSlug: "speaker-separation",
		benefits: [
			"Identify who said what in any recording",
			"Works with messy real-world audio",
			"Improve transcript accuracy for multi-person calls",
			"Export labeled transcripts for reference or legal use",
		],
		audiences: ["Journalists", "Researchers", "HR Teams", "Legal Teams"],
	},
	{
		category: "Marketing & Research",
		icon: "📰",
		title: "News & Market Intelligence",
		description:
			"Analyze news articles and web content to extract key insights, sentiment, and trends relevant to your business or industry.",
		tool: "News Analyzer",
		toolSlug: "news-analyzer",
		benefits: [
			"Track competitor mentions and industry news",
			"Extract key facts and sentiment from articles",
			"Monitor market shifts before competitors do",
			"Save hours of manual research time",
		],
		audiences: ["Marketing Teams", "Analysts", "Business Developers"],
	},
	{
		category: "Customer Experience",
		icon: "⭐",
		title: "Customer Feedback Analysis",
		description:
			"Process surveys, reviews, and support tickets in bulk to identify sentiment trends, recurring issues, and opportunities.",
		tool: "Feedback Analyzer",
		toolSlug: "feedback-analyzer",
		benefits: [
			"Analyze hundreds of reviews in minutes",
			"Surface recurring complaints automatically",
			"Measure sentiment over time",
			"Prioritize product improvements with data",
		],
		audiences: ["Product Managers", "Customer Success", "Founders"],
	},
];

export default function UseCasesPage() {
	return (
		<div className="min-h-screen bg-background">
			<UseCasesPageTracker />
			{/* Hero */}
			<section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 py-20 text-center">
				<div className="mx-auto max-w-4xl">
					<div className="mb-4 inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
						Real workflows. Real results.
					</div>
					<h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
						How Small Businesses Use{" "}
						<span className="text-primary">{config.appName}</span>
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						From contract review to expense processing — see exactly
						how teams like yours are saving 10+ hours a week with
						AI-powered tools.
					</p>
					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link
							href="/auth/signup"
							className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							Start for free
						</Link>
						<Link
							href="/tools"
							className="inline-flex items-center rounded-lg border px-6 py-3 font-medium transition-colors hover:bg-muted"
						>
							Browse all tools →
						</Link>
					</div>
				</div>
			</section>

			{/* Use Cases */}
			<section className="px-4 py-16">
				<div className="mx-auto max-w-6xl space-y-16">
					{useCases.map((useCase) => (
						<div
							key={useCase.toolSlug}
							className="grid gap-8 md:grid-cols-2 md:items-start"
						>
							{/* Left: description */}
							<div>
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
									<span>{useCase.icon}</span>
									<span>{useCase.category}</span>
								</div>
								<h2 className="mb-4 font-bold text-2xl tracking-tight md:text-3xl">
									{useCase.title}
								</h2>
								<p className="mb-6 text-lg text-muted-foreground">
									{useCase.description}
								</p>
								<div className="mb-6 flex flex-wrap gap-2">
									{useCase.audiences.map((audience) => (
										<span
											key={audience}
											className="rounded-full bg-muted px-3 py-1 text-sm"
										>
											{audience}
										</span>
									))}
								</div>
								<Link
									href={`/tools/${useCase.toolSlug}`}
									className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
								>
									Learn more about {useCase.tool} →
								</Link>
							</div>

							{/* Right: benefits */}
							<div className="rounded-xl border bg-muted/20 p-6">
								<h3 className="mb-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
									What you get
								</h3>
								<ul className="space-y-3">
									{useCase.benefits.map((benefit) => (
										<li
											key={benefit}
											className="flex items-start gap-3"
										>
											<span className="mt-0.5 flex-shrink-0 text-green-500">
												✓
											</span>
											<span className="text-sm">
												{benefit}
											</span>
										</li>
									))}
								</ul>
								<div className="mt-6 border-t pt-4">
									<Link
										href={`/app/tools/${useCase.toolSlug}`}
										className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
									>
										Try {useCase.tool} free →
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="border-t bg-muted/20 px-4 py-16 text-center">
				<div className="mx-auto max-w-2xl">
					<h2 className="mb-4 font-bold text-3xl">
						Ready to save 10+ hours per week?
					</h2>
					<p className="mb-8 text-lg text-muted-foreground">
						Join thousands of small businesses automating their most
						time-consuming document workflows.
					</p>
					<Link
						href="/auth/signup"
						className="inline-flex items-center rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Get started free — no credit card required
					</Link>
				</div>
			</section>
		</div>
	);
}
