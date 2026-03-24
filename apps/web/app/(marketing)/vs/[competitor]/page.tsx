import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import {
	ArrowRightIcon,
	CheckCircleIcon,
	MinusCircleIcon,
	XCircleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

const siteUrl = getBaseUrl();

interface ComparisonRow {
	feature: string;
	us: "yes" | "no" | "partial";
	them: "yes" | "no" | "partial";
}

interface CompetitorPage {
	slug: string;
	name: string;
	headline: string;
	description: string;
	ourPitch: string;
	theirPitch: string;
	comparison: ComparisonRow[];
	advantages: string[];
	switchReasons: string[];
}

const competitors: CompetitorPage[] = [
	{
		slug: "otter-ai",
		name: "Otter.ai",
		headline: `${config.appName} vs Otter.ai — More Than Meeting Notes`,
		description: `Comparing ${config.appName} and Otter.ai for meeting transcription, summarization, and AI-powered business automation.`,
		ourPitch: "A full AI productivity suite beyond meeting notes",
		theirPitch: "Meeting transcription and note-taking focused",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "No per-user seat fees", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "partial" },
		],
		advantages: [
			"8 AI tools in one platform — not just meeting notes",
			"Process contracts, invoices, expenses, and feedback in minutes",
			"Credit-based pricing means you only pay for what you use",
			"No seat fees — great for small teams that share access",
		],
		switchReasons: [
			"You're paying for Otter.ai just for transcription but need document analysis too",
			"You want one AI platform instead of 5 separate subscriptions",
			"You need contract review, not just meeting notes",
			"You're a freelancer or small team tired of per-seat pricing",
		],
	},
	{
		slug: "fireflies-ai",
		name: "Fireflies.ai",
		headline: `${config.appName} vs Fireflies.ai — Beyond Meeting Intelligence`,
		description: `Comparing ${config.appName} and Fireflies.ai for AI meeting summaries, transcription, and business workflow automation.`,
		ourPitch: "AI tools for every business workflow, not just meetings",
		theirPitch: "Meeting intelligence and CRM integration focused",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "CRM integrations", us: "partial", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Pay-per-use pricing", us: "yes", them: "no" },
			{ feature: "No bot joining meetings", us: "yes", them: "no" },
		],
		advantages: [
			"No meeting bot required — upload any audio or transcript file",
			"Process expenses and invoices alongside your meeting summaries",
			"Credit-based pricing — no monthly seat minimums",
			"Analyze news, contracts, and feedback all from one dashboard",
		],
		switchReasons: [
			"You don't want a bot joining every meeting",
			"You need more than meeting intelligence — contracts, invoices, expenses",
			"You want flexible pay-as-you-go instead of monthly seat commitments",
			"You're a small team or solo operator who needs multiple AI tools",
		],
	},
	{
		slug: "docparser",
		name: "Docparser",
		headline: `${config.appName} vs Docparser — AI Understanding vs Rule-Based Parsing`,
		description: `Comparing ${config.appName} and Docparser for invoice processing, document extraction, and intelligent data capture.`,
		ourPitch: "AI-powered document understanding without template setup",
		theirPitch: "Template-based document parsing with custom rules",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Zero template setup", us: "yes", them: "no" },
			{ feature: "Natural language output", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{
				feature: "Works on any document layout",
				us: "yes",
				them: "partial",
			},
			{ feature: "No training required", us: "yes", them: "no" },
		],
		advantages: [
			"No templates or rules to configure — AI understands any invoice format",
			"Extract structured data from invoices in seconds with no setup",
			"8 AI tools beyond document parsing for complete business automation",
			"Credit-based pricing — no annual contracts or minimums",
		],
		switchReasons: [
			"You're spending hours setting up document parsing templates",
			"Your invoices come in too many different formats for rule-based tools",
			"You want AI that understands context, not just field positions",
			"You need expense categorization and contract review alongside invoice parsing",
		],
	},
	{
		slug: "zapier",
		name: "Zapier",
		headline: `${config.appName} vs Zapier — AI Document Intelligence vs Workflow Automation`,
		description: `Comparing ${config.appName} and Zapier for AI-powered document processing, meeting summarization, and business automation.`,
		ourPitch:
			"AI-native document analysis and processing for business workflows",
		theirPitch: "No-code workflow automation connecting third-party apps",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract clause analysis", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Zero API configuration", us: "yes", them: "no" },
			{ feature: "No per-task limits", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Purpose-built AI — not a generic automation layer on top of other tools",
			"No API keys, webhooks, or integration setup required",
			"Process any document format immediately — PDF, CSV, audio, text",
			"Credit-based pricing — pay only for what you actually process",
		],
		switchReasons: [
			"You need actual AI document understanding, not just routing data between apps",
			"You're tired of configuring complex multi-step Zaps just to extract invoice data",
			"You want meeting summaries and contract analysis without stitching together 5 tools",
			"You're a small team that doesn't have an ops engineer to maintain Zapier workflows",
		],
	},
	{
		slug: "notion-ai",
		name: "Notion AI",
		headline: `${config.appName} vs Notion AI — Specialized Tools vs All-in-One Workspace`,
		description: `Comparing ${config.appName} and Notion AI for document summarization, meeting notes, business automation, and AI productivity.`,
		ourPitch: "Specialized AI tools for document-heavy business workflows",
		theirPitch: "AI writing and summarization inside a team wiki/notes app",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Upload PDF/audio files", us: "yes", them: "partial" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
		],
		advantages: [
			"Built for processing documents — not writing or editing them",
			"Handles PDFs, audio recordings, and CSVs that Notion AI can't process well",
			"Structured output every time — not conversational AI writing",
			"Process invoices and contracts that live outside your Notion workspace",
		],
		switchReasons: [
			"You need to process documents that aren't already in Notion",
			"You want structured data extraction from invoices, not AI-written summaries",
			"You need speaker-labeled transcripts from audio recordings",
			"You're doing more document analysis than document writing",
		],
	},
	{
		slug: "adobe-acrobat-ai",
		name: "Adobe Acrobat AI",
		headline: `${config.appName} vs Adobe Acrobat AI — Purpose-Built vs PDF Suite Add-On`,
		description: `Comparing ${config.appName} and Adobe Acrobat AI Assistant for contract analysis, invoice processing, and business document intelligence.`,
		ourPitch:
			"Affordable AI document processing without an Adobe subscription",
		theirPitch: "AI Q&A assistant built into the Adobe Acrobat PDF suite",
		comparison: [
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{
				feature: "No Adobe subscription required",
				us: "yes",
				them: "no",
			},
		],
		advantages: [
			"No $30+/month Adobe subscription required",
			"Process audio files, CSV exports, and invoices — not just PDFs",
			"8 specialized AI tools, not a general-purpose PDF Q&A assistant",
			"Structured output for easy copy-paste to spreadsheets or accounting tools",
		],
		switchReasons: [
			"You're paying for Adobe Acrobat mainly to use the AI assistant",
			"You process more than just PDFs — audio, CSV, text files too",
			"You want structured invoice extraction, not a chat interface for PDFs",
			"You need meeting summaries and expense reports alongside contract review",
		],
	},
	{
		slug: "microsoft-copilot",
		name: "Microsoft Copilot",
		headline: `${config.appName} vs Microsoft Copilot — Specialized AI vs Office Add-On`,
		description: `Comparing ${config.appName} and Microsoft Copilot for business document analysis, invoice processing, and meeting summarization.`,
		ourPitch:
			"Affordable AI tools built for document workflows — no Microsoft 365 required",
		theirPitch: "AI assistant woven into the Microsoft 365 suite",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Works without Microsoft 365", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
		],
		advantages: [
			"No Microsoft 365 Business subscription required ($22+/user/month)",
			"Structured output designed for downstream use — spreadsheets, accounting tools, APIs",
			"Speaker separation for audio files — Copilot focuses on Teams transcription",
			"8 specialized tools for consistent, repeatable document processing",
		],
		switchReasons: [
			"You want document AI without paying for a full Microsoft 365 seat",
			"You process files outside the Microsoft ecosystem (audio, non-Word docs)",
			"You need structured JSON output, not a summarized chat reply",
			"You want expense and invoice extraction without Excel macros",
		],
	},
	{
		slug: "google-gemini",
		name: "Google Gemini",
		headline: `${config.appName} vs Google Gemini — Purpose-Built Workflows vs General AI`,
		description: `Comparing ${config.appName} and Google Gemini for business document processing, meeting summarization, and invoice extraction.`,
		ourPitch:
			"Repeatable AI workflows for business documents — not a chatbot",
		theirPitch: "Google's general-purpose multimodal AI assistant",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{ feature: "Consistent output schema", us: "yes", them: "no" },
		],
		advantages: [
			"Deterministic structured output — same document format every time",
			"8 purpose-built tools optimized for business document workflows",
			"Full job history so you can re-run any past document without re-uploading",
			"No prompt engineering required — just upload and go",
		],
		switchReasons: [
			"You're tired of copy-pasting invoice data from chat replies into spreadsheets",
			"You need consistent output format across all processed documents",
			"You want a tool that works the same way every run — not a conversational assistant",
			"You process audio, CSV, and PDF files regularly for business workflows",
		],
	},
	{
		slug: "descript",
		name: "Descript",
		headline: `${config.appName} vs Descript — Document Intelligence vs Audio Editing`,
		description: `Comparing ${config.appName} and Descript for meeting transcription, speaker separation, and audio file processing.`,
		ourPitch:
			"Meeting summaries and speaker-labeled transcripts — no video editor",
		theirPitch: "Audio and video editor with built-in transcription",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Transcript export", us: "yes", them: "yes" },
			{ feature: "Invoice data extraction", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{
				feature: "No per-seat fee for batch processing",
				us: "yes",
				them: "no",
			},
		],
		advantages: [
			"8 AI tools beyond audio — invoices, contracts, expenses, feedback",
			"No video editing interface to navigate — built for document workflows",
			"Structured output for meeting summaries ready to paste into your CRM or notes",
			"Process audio files as part of a larger business automation workflow",
		],
		switchReasons: [
			"You use Descript only for transcription, not video editing",
			"You want meeting summaries AND invoice/contract processing in one place",
			"You need structured output instead of a raw transcript",
			"You want to batch process recordings without paying per creator seat",
		],
	},
	{
		slug: "chatgpt",
		name: "ChatGPT",
		headline: `${config.appName} vs ChatGPT — Purpose-Built vs General AI`,
		description: `Comparing ${config.appName} and ChatGPT for business document analysis, meeting summarization, and invoice processing.`,
		ourPitch: "Purpose-built AI workflows for business documents",
		theirPitch: "General-purpose AI assistant for any task",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{
				feature: "Invoice structured extraction",
				us: "yes",
				them: "partial",
			},
			{ feature: "Contract clause analysis", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense CSV processing", us: "yes", them: "partial" },
			{ feature: "Consistent structured output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{
				feature: "Team sharing & org accounts",
				us: "yes",
				them: "partial",
			},
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "No prompt engineering needed", us: "yes", them: "no" },
		],
		advantages: [
			"Purpose-built workflows — no prompt engineering needed",
			"Consistent structured output every time (not conversational guessing)",
			"Job history with re-run capability — great for recurring tasks",
			"Processes audio files and PDFs directly — no copy-paste needed",
		],
		switchReasons: [
			"You're tired of crafting prompts to get consistent document output",
			"You want to upload a PDF invoice and get structured JSON — not a chat response",
			"You need job history and the ability to re-run past tasks",
			"You want a workflow built for your business, not a general AI chat window",
		],
	},
];

function Icon({ value }: { value: "yes" | "no" | "partial" }) {
	if (value === "yes") {
		return <CheckCircleIcon className="size-5 text-green-500" />;
	}
	if (value === "no") {
		return <XCircleIcon className="size-5 text-red-400" />;
	}
	return <MinusCircleIcon className="size-5 text-yellow-500" />;
}

export async function generateStaticParams() {
	return competitors.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
	const { competitor } = await params;
	const page = competitors.find((c) => c.slug === competitor);
	if (!page) {
		return {};
	}
	return {
		title: `${page.headline}`,
		description: page.description,
		alternates: { canonical: `${siteUrl}/vs/${page.slug}` },
		openGraph: {
			type: "website",
			url: `${siteUrl}/vs/${page.slug}`,
			title: page.headline,
			description: page.description,
			images: [
				{
					url: `${siteUrl}/api/og?title=${encodeURIComponent(page.headline)}&description=${encodeURIComponent(page.description)}`,
					width: 1200,
					height: 630,
					alt: page.headline,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: page.headline,
			description: page.description,
		},
	};
}

export default async function CompetitorPage({
	params,
}: {
	params: Promise<{ competitor: string }>;
}) {
	const { competitor } = await params;
	const page = competitors.find((c) => c.slug === competitor);
	if (!page) {
		notFound();
	}

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
			{
				"@type": "ListItem",
				position: 2,
				name: `vs ${page.name}`,
				item: `${siteUrl}/vs/${page.slug}`,
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>

			{/* Hero */}
			<section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
				<div className="container mx-auto max-w-4xl px-4 text-center">
					<p className="mb-4 font-semibold text-primary text-sm uppercase tracking-wider">
						Comparison
					</p>
					<h1 className="font-bold text-4xl leading-tight md:text-5xl">
						{config.appName} vs {page.name}
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-foreground/60 text-lg">
						{page.description}
					</p>
					<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							href="/auth/signup"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
						>
							Try {config.appName} Free
							<ArrowRightIcon className="size-4" />
						</Link>
						<Link
							href="/pricing"
							className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-semibold transition hover:bg-accent"
						>
							See Pricing
						</Link>
					</div>
				</div>
			</section>

			{/* One-line pitches */}
			<section className="border-b border-border bg-muted/30 py-10">
				<div className="container mx-auto max-w-4xl px-4">
					<div className="grid gap-8 sm:grid-cols-2">
						<div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
							<p className="mb-1 font-semibold text-primary text-sm uppercase tracking-wider">
								{config.appName}
							</p>
							<p className="text-foreground/80">
								{page.ourPitch}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background p-6">
							<p className="mb-1 font-semibold text-sm text-foreground/50 uppercase tracking-wider">
								{page.name}
							</p>
							<p className="text-foreground/60">
								{page.theirPitch}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Feature comparison table */}
			<section className="py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						Feature Comparison
					</h2>
					<div className="overflow-hidden rounded-xl border border-border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="px-6 py-4 text-left font-semibold">
										Feature
									</th>
									<th className="px-6 py-4 text-center font-semibold text-primary">
										{config.appName}
									</th>
									<th className="px-6 py-4 text-center font-semibold text-foreground/50">
										{page.name}
									</th>
								</tr>
							</thead>
							<tbody>
								{page.comparison.map((row, i) => (
									<tr
										key={row.feature}
										className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
									>
										<td className="px-6 py-3 font-medium">
											{row.feature}
										</td>
										<td className="px-6 py-3 text-center">
											<div className="flex justify-center">
												<Icon value={row.us} />
											</div>
										</td>
										<td className="px-6 py-3 text-center">
											<div className="flex justify-center">
												<Icon value={row.them} />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className="mt-3 text-center text-foreground/40 text-xs">
						✅ Yes &nbsp;|&nbsp; ❌ No &nbsp;|&nbsp; 🟡 Partial
					</p>
				</div>
			</section>

			{/* Why switch */}
			<section className="bg-muted/30 py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						Why teams switch from {page.name} to {config.appName}
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{page.switchReasons.map((reason) => (
							<div
								key={reason}
								className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
							>
								<CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-primary" />
								<p className="text-foreground/80 text-sm">
									{reason}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Our advantages */}
			<section className="py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						What you get with {config.appName}
					</h2>
					<ul className="mx-auto max-w-2xl space-y-4">
						{page.advantages.map((adv) => (
							<li key={adv} className="flex items-start gap-3">
								<CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-green-500" />
								<span className="text-foreground/80">
									{adv}
								</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* CTA */}
			<section className="border-t border-border bg-primary/5 py-20">
				<div className="container mx-auto max-w-3xl px-4 text-center">
					<h2 className="font-bold text-3xl md:text-4xl">
						Ready to switch from {page.name}?
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-foreground/60 text-lg">
						Try {config.appName} free. No credit card required.
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							href="/auth/signup"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
						>
							Start Free — No Credit Card
							<ArrowRightIcon className="size-4" />
						</Link>
						<Link
							href="/pricing"
							className="text-foreground/60 text-sm underline underline-offset-4 hover:text-foreground"
						>
							Compare plans →
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
