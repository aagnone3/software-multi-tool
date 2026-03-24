import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `${config.appName} vs Alternatives — AI Tool Comparisons`,
	description: `Compare ${config.appName} with Otter.ai, Fireflies, Docparser, ChatGPT, Zapier, Notion AI, Adobe Acrobat AI, Microsoft Copilot, Google Gemini, and Descript. See how we stack up on features, pricing, and ease of use.`,
	alternates: { canonical: `${siteUrl}/vs` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/vs`,
		title: `${config.appName} vs Alternatives`,
		description: `Compare ${config.appName} with leading AI tools. See which is right for your business.`,
	},
};

const comparisons = [
	{
		slug: "otter-ai",
		name: "Otter.ai",
		tagline: "Meeting transcription focused",
		diff: "We offer 8 tools beyond meeting notes",
	},
	{
		slug: "fireflies-ai",
		name: "Fireflies.ai",
		tagline: "Meeting intelligence & CRM",
		diff: "No bot, no seat fees, more workflow tools",
	},
	{
		slug: "docparser",
		name: "Docparser",
		tagline: "Template-based document parsing",
		diff: "AI understanding — no template setup",
	},
	{
		slug: "chatgpt",
		name: "ChatGPT",
		tagline: "General-purpose AI assistant",
		diff: "Purpose-built workflows, consistent output",
	},
	{
		slug: "zapier",
		name: "Zapier",
		tagline: "No-code workflow automation",
		diff: "AI-native document intelligence, not routing",
	},
	{
		slug: "notion-ai",
		name: "Notion AI",
		tagline: "AI writing inside a team workspace",
		diff: "Specialized processing beyond writing assistance",
	},
	{
		slug: "adobe-acrobat-ai",
		name: "Adobe Acrobat AI",
		tagline: "PDF Q&A inside the Adobe suite",
		diff: "No Adobe subscription — works on audio, CSV, and PDFs",
	},
	{
		slug: "microsoft-copilot",
		name: "Microsoft Copilot",
		tagline: "AI assistant embedded in Microsoft 365",
		diff: "No $22+/user Microsoft 365 seat required",
	},
	{
		slug: "google-gemini",
		name: "Google Gemini",
		tagline: "Google's general-purpose multimodal AI",
		diff: "Purpose-built workflows with consistent structured output",
	},
	{
		slug: "descript",
		name: "Descript",
		tagline: "Audio/video editor with transcription",
		diff: "Meeting summaries + 7 more AI tools, no video editor needed",
	},
];

export default function VsIndexPage() {
	return (
		<section className="py-20">
			<div className="container mx-auto max-w-4xl px-4">
				<div className="mb-12 text-center">
					<p className="mb-3 font-semibold text-primary text-sm uppercase tracking-wider">
						Comparisons
					</p>
					<h1 className="font-bold text-4xl md:text-5xl">
						{config.appName} vs Alternatives
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-foreground/60 text-lg">
						See how {config.appName} compares to other AI tools for
						business automation, document analysis, and meeting
						intelligence.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{comparisons.map((c) => (
						<Link
							key={c.slug}
							href={`/vs/${c.slug}`}
							className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
						>
							<div className="mb-1 flex items-center justify-between">
								<p className="font-bold text-lg">
									{config.appName} vs {c.name}
								</p>
								<ArrowRightIcon className="size-4 text-foreground/40 transition group-hover:translate-x-1 group-hover:text-primary" />
							</div>
							<p className="text-foreground/50 text-sm">
								{c.tagline}
							</p>
							<p className="mt-3 text-foreground/70 text-sm">
								{c.diff}
							</p>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
