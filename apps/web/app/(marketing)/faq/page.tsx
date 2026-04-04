import { StickyCta } from "@marketing/home/components/StickyCta";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `FAQ — ${config.appName}`,
	description: `Frequently asked questions about ${config.appName} — AI-powered tools for document analysis, meeting summarization, expense management, and more.`,
	alternates: { canonical: `${siteUrl}/faq` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/faq`,
		title: `FAQ — ${config.appName}`,
		description: `Answers to common questions about ${config.appName}.`,
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`FAQ — ${config.appName}`)}&description=${encodeURIComponent("Answers to common questions about our AI-powered tools.")}`,
				width: 1200,
				height: 630,
				alt: `FAQ — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `FAQ — ${config.appName}`,
		description: `Frequently asked questions about ${config.appName}.`,
	},
};

const breadcrumbJsonLd = {
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: [
		{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
		{
			"@type": "ListItem",
			position: 2,
			name: "FAQ",
			item: `${siteUrl}/faq`,
		},
	],
};

const faqSections = [
	{
		heading: "Getting Started",
		faqs: [
			{
				q: "What is this platform?",
				a: `${config.appName} is an AI-powered productivity suite that turns complex documents and data into structured, actionable results. You upload a file or paste text, run a tool, and get a clean output in seconds — no prompt engineering required.`,
			},
			{
				q: "Do I need an account to try it?",
				a: "You can explore the marketing pages and tool descriptions without signing in. To actually run a tool, you'll need a free account. No credit card required.",
			},
			{
				q: "How do I get started?",
				a: "Sign up for a free account, navigate to the Tools section, pick a tool that fits your task, upload your document or paste your text, and click Run. Your results appear in seconds.",
			},
		],
	},
	{
		heading: "Credits and Billing",
		faqs: [
			{
				q: "What are credits?",
				a: "Credits are the currency for running tools. Each tool run costs a fixed number of credits depending on the complexity of the task. You can see the credit cost on each tool's page before you run it.",
			},
			{
				q: "How many free credits do I get?",
				a: "Every new account receives a free credit allocation to try any tool. The exact amount is shown on the pricing page. No credit card is needed to start.",
			},
			{
				q: "Do credits expire?",
				a: "Credits included in a monthly plan roll over as long as your subscription remains active. One-time purchased credit packs do not expire.",
			},
			{
				q: "What happens if I run out of credits?",
				a: "You can purchase additional credit packs at any time from the billing page without changing your plan. Alternatively, you can upgrade to a higher plan for a larger monthly credit allowance.",
			},
			{
				q: "Can I cancel my subscription anytime?",
				a: "Yes. Cancel at any time from your billing settings. You keep access through the end of the current billing period with no additional charges.",
			},
		],
	},
	{
		heading: "Tools",
		faqs: [
			{
				q: "What tools are available?",
				a: "The current suite includes: Contract Analyzer (extract key clauses and obligations), Meeting Summarizer (turn transcripts into structured action items), Expense Categorizer (sort receipts and transactions by category), Invoice Processor (extract vendor, amount, and line items), News Analyzer (summarize and classify news articles), Speaker Separation (label who said what in meeting recordings), Feedback Analyzer (extract sentiment and themes from reviews), and Document Summarizer (condense long documents into key points).",
			},
			{
				q: "What file formats are supported?",
				a: "Most tools accept PDF, DOCX, TXT, and plain text input. Audio tools accept MP3, WAV, M4A, and other common audio formats. The upload dialog for each tool shows the accepted formats before you upload.",
			},
			{
				q: "Is there a file size limit?",
				a: "Yes. File size limits vary by tool and plan. The limits are shown on each tool's page. Large audio files for speaker separation, for example, have higher limits on paid plans.",
			},
			{
				q: "Can I run tools on the same document multiple times?",
				a: "Yes. There are no restrictions on re-running tools. Each run consumes credits, but results from previous runs are saved in your job history.",
			},
		],
	},
	{
		heading: "Privacy and Security",
		faqs: [
			{
				q: "Is my data secure?",
				a: "Yes. Files you upload are processed in isolated execution environments and deleted after processing. We do not store your document content long-term and we do not use your data to train models.",
			},
			{
				q: "Who can see my results?",
				a: "Only you (and your organization members, if you use the team features). Results are private by default. Public sharing is opt-in.",
			},
			{
				q: "Do you share my data with third parties?",
				a: "We use AI providers to process your documents, but we transmit only the minimum content needed for the tool to function. We do not sell your data. See our privacy policy for full details.",
			},
		],
	},
	{
		heading: "Teams and Organizations",
		faqs: [
			{
				q: "Can I share access with my team?",
				a: "Yes. You can create an organization, invite members, and manage shared credit pools and billing from a single account. Organization features are available on paid plans.",
			},
			{
				q: "How does team billing work?",
				a: "When you create an organization, the organization has its own credit balance. Members run tools against the shared organization credits, not their personal balance. The organization admin manages billing.",
			},
		],
	},
];

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqSections.flatMap(({ faqs }) =>
		faqs.map(({ q, a }) => ({
			"@type": "Question",
			name: q,
			acceptedAnswer: { "@type": "Answer", text: a },
		})),
	),
};

export default function FaqPage() {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
			/>

			<div className="container max-w-3xl pt-32 pb-24">
				<div className="mb-16 text-center">
					<h1 className="mb-4 font-bold text-5xl tracking-tight">
						Frequently Asked Questions
					</h1>
					<p className="text-balance text-lg text-muted-foreground">
						Everything you need to know about {config.appName}.
						Can't find your answer?{" "}
						<Link
							href="/contact"
							className="underline hover:text-foreground"
						>
							Contact us
						</Link>
						.
					</p>
				</div>

				<div className="space-y-12">
					{faqSections.map((section) => (
						<section key={section.heading}>
							<h2 className="mb-6 border-b pb-3 font-semibold text-2xl">
								{section.heading}
							</h2>
							<dl className="space-y-6">
								{section.faqs.map(({ q, a }) => (
									<div key={q}>
										<dt className="mb-2 font-medium text-base">
											{q}
										</dt>
										<dd className="text-muted-foreground text-sm leading-relaxed">
											{a}
										</dd>
									</div>
								))}
							</dl>
						</section>
					))}
				</div>

				<div className="mt-16 rounded-xl border bg-muted/40 p-8 text-center">
					<h2 className="mb-2 font-semibold text-xl">
						Still have questions?
					</h2>
					<p className="mb-4 text-muted-foreground text-sm">
						We're happy to help. Reach out and we'll get back to you
						quickly.
					</p>
					<Link
						href="/contact"
						className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					>
						Contact Support
					</Link>
				</div>
			</div>
			<StickyCta />
		</>
	);
}
