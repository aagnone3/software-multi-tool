import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `AI Tools by Industry — ${config.appName}`,
	description:
		"Discover how professionals in accounting, law, consulting, HR, real estate, and more are using AI tools to save hours every week.",
	alternates: {
		canonical: `${siteUrl}/for`,
	},
	openGraph: {
		type: "website",
		url: `${siteUrl}/for`,
		title: `AI Tools by Industry — ${config.appName}`,
		description:
			"Discover how professionals in accounting, law, consulting, HR, real estate, and more are using AI tools to save hours every week.",
	},
};

const INDUSTRY_CARDS = [
	{
		slug: "accountants",
		icon: "📊",
		title: "Accountants & Bookkeepers",
		description:
			"Automate invoice data extraction, expense categorization, and contract review.",
	},
	{
		slug: "lawyers",
		icon: "⚖️",
		title: "Lawyers & Legal Teams",
		description:
			"Review contracts faster, summarize depositions, and analyze legal documents.",
	},
	{
		slug: "consultants",
		icon: "💼",
		title: "Consultants & Advisors",
		description:
			"Deliver client insights faster with AI-powered document analysis and meeting summaries.",
	},
	{
		slug: "hr-teams",
		icon: "👥",
		title: "HR & People Ops",
		description:
			"Analyze employee feedback, summarize interviews, and review employment contracts.",
	},
	{
		slug: "real-estate",
		icon: "🏠",
		title: "Real Estate Professionals",
		description:
			"Review purchase agreements, summarize showings, and track market trends.",
	},
	{
		slug: "freelancers",
		icon: "🧑‍💻",
		title: "Freelancers & Solopreneurs",
		description:
			"Process invoices, analyze client contracts, and summarize client calls.",
	},
	{
		slug: "small-businesses",
		icon: "🏪",
		title: "Small Businesses",
		description:
			"Automate document workflows, analyze feedback, and reduce manual data entry.",
	},
	{
		slug: "marketing-agencies",
		icon: "📣",
		title: "Marketing Agencies",
		description:
			"Analyze campaign feedback, summarize client calls, and research content topics at scale.",
	},
	{
		slug: "medical-practices",
		icon: "🏥",
		title: "Medical Practices",
		description:
			"Summarize care coordination meetings, analyze patient feedback, and review vendor contracts.",
	},
	{
		slug: "ecommerce",
		icon: "🛒",
		title: "E-Commerce Businesses",
		description:
			"Process product reviews, categorize expenses, and review supplier agreements faster.",
	},
	{
		slug: "podcast-producers",
		icon: "🎙️",
		title: "Podcast Producers",
		description:
			"Separate speakers, generate transcripts, and create episode summaries automatically.",
	},
];

export default function ForIndexPage() {
	return (
		<div className="container mx-auto max-w-5xl px-4 py-16">
			<div className="mb-12 text-center">
				<h1 className="mb-4 font-bold text-4xl tracking-tight">
					AI Tools for Every Industry
				</h1>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					See how professionals across industries are using{" "}
					{config.appName} to save hours every week on document
					processing, analysis, and reporting.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{INDUSTRY_CARDS.map((industry) => (
					<Link
						key={industry.slug}
						href={`/for/${industry.slug}`}
						className="group block rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
					>
						<div className="mb-3 text-3xl">{industry.icon}</div>
						<h2 className="mb-2 font-semibold text-lg group-hover:text-primary">
							{industry.title}
						</h2>
						<p className="text-muted-foreground text-sm">
							{industry.description}
						</p>
						<div className="mt-4 font-medium text-primary text-sm">
							See how it works →
						</div>
					</Link>
				))}
			</div>

			<div className="mt-16 rounded-2xl border bg-muted/50 p-8 text-center">
				<h2 className="mb-2 font-bold text-2xl">
					Don&apos;t see your industry?
				</h2>
				<p className="mb-6 text-muted-foreground">
					Our AI tools work for any professional who handles
					documents, meetings, or data. Try them free — no credit card
					required.
				</p>
				<Link
					href="/auth/signup"
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm hover:bg-primary/90"
				>
					Start for free
				</Link>
			</div>
		</div>
	);
}
