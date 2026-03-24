import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Integrations — ${config.appName}`,
	description: `${config.appName} works with the tools your team already uses. Import files from Google Drive, Dropbox, and more — export results to Notion, Slack, and beyond.`,
	alternates: { canonical: `${siteUrl}/integrations` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/integrations`,
		title: `Integrations — ${config.appName}`,
		description: `Connect ${config.appName} to your existing workflow.`,
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`Integrations — ${config.appName}`)}&description=${encodeURIComponent("Works with the tools your team already uses.")}`,
				width: 1200,
				height: 630,
				alt: `Integrations — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Integrations — ${config.appName}`,
		description: `Connect ${config.appName} to Google Drive, Dropbox, Slack, Notion, and more.`,
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
			name: "Integrations",
			item: `${siteUrl}/integrations`,
		},
	],
};

interface Integration {
	name: string;
	description: string;
	category: string;
	icon: string;
	status: "available" | "coming-soon";
	useCases: string[];
}

const integrations: Integration[] = [
	{
		name: "Google Drive",
		description:
			"Import documents, spreadsheets, and PDFs directly from Google Drive. Process contracts, invoices, and meeting notes without leaving your workflow.",
		category: "File Storage",
		icon: "📁",
		status: "coming-soon",
		useCases: [
			"Analyze contracts stored in shared drives",
			"Process invoices from team folders",
			"Summarize meeting transcripts saved from Google Meet",
		],
	},
	{
		name: "Dropbox",
		description:
			"Connect your Dropbox account to run AI tools on files you've already stored. No manual uploads needed.",
		category: "File Storage",
		icon: "📦",
		status: "coming-soon",
		useCases: [
			"Batch-process expense receipts in a Dropbox folder",
			"Analyze all contracts in a shared workspace",
			"Auto-summarize audio files as they're added",
		],
	},
	{
		name: "Slack",
		description:
			"Get job completion notifications delivered to your Slack channel. Know the moment your AI analysis is ready without checking a dashboard.",
		category: "Communication",
		icon: "💬",
		status: "coming-soon",
		useCases: [
			"Get alerted when a contract analysis completes",
			"Share meeting summaries directly to a project channel",
			"Notify the team when expense reports are processed",
		],
	},
	{
		name: "Notion",
		description:
			"Push AI-generated summaries, analysis results, and structured data directly into your Notion workspace.",
		category: "Productivity",
		icon: "📝",
		status: "coming-soon",
		useCases: [
			"Auto-create meeting notes pages from summaries",
			"Add contract analysis results to a deal database",
			"Log processed invoices to a financial tracker",
		],
	},
	{
		name: "Zapier",
		description:
			"Connect to 6,000+ apps via Zapier. Trigger AI tool runs from any workflow, or route results to any downstream system.",
		category: "Automation",
		icon: "⚡",
		status: "coming-soon",
		useCases: [
			"Trigger invoice processing when an email attachment arrives",
			"Run meeting summarizer when a Zoom recording is saved",
			"Send expense categorization results to QuickBooks",
		],
	},
	{
		name: "Microsoft OneDrive",
		description:
			"Access files from your OneDrive and SharePoint directly. Ideal for teams already embedded in the Microsoft 365 ecosystem.",
		category: "File Storage",
		icon: "☁️",
		status: "coming-soon",
		useCases: [
			"Analyze Word documents and PDFs stored in SharePoint",
			"Process Teams meeting recordings",
			"Summarize contracts from OneDrive shared folders",
		],
	},
	{
		name: "Webhook API",
		description:
			"Trigger tool runs and receive results via webhook. Build custom integrations with any system that supports HTTP.",
		category: "Developer",
		icon: "🔗",
		status: "coming-soon",
		useCases: [
			"Integrate with internal CRM or ERP systems",
			"Build custom notification pipelines",
			"Route results to proprietary databases",
		],
	},
	{
		name: "CSV / File Upload",
		description:
			"Already supported — upload files directly from your computer. No integration required to get started today.",
		category: "Built-in",
		icon: "📤",
		status: "available",
		useCases: [
			"Upload any PDF, DOCX, CSV, or audio file",
			"Batch-process expense CSVs",
			"Analyze contracts uploaded from your device",
		],
	},
];

const _categories = Array.from(new Set(integrations.map((i) => i.category)));

export default function IntegrationsPage() {
	const available = integrations.filter((i) => i.status === "available");
	const comingSoon = integrations.filter((i) => i.status === "coming-soon");

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>

			<main className="container mx-auto max-w-6xl px-4 py-16">
				{/* Header */}
				<div className="mb-12 text-center">
					<div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-primary text-sm">
						<span>🔌</span>
						<span>Connect your workflow</span>
					</div>
					<h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
						Works with the tools you already use
					</h1>
					<p className="mx-auto max-w-2xl text-foreground/70 text-xl">
						{config.appName} is designed to slot into your existing
						workflow — not replace it. Connect the apps your team
						already depends on.
					</p>
				</div>

				{/* Available Now */}
				{available.length > 0 && (
					<section className="mb-16">
						<h2 className="mb-6 font-semibold text-2xl">
							Available now
						</h2>
						<div className="grid gap-6 md:grid-cols-2">
							{available.map((integration) => (
								<div
									key={integration.name}
									className="rounded-xl border bg-card p-6"
								>
									<div className="mb-3 flex items-center gap-3">
										<span className="text-3xl">
											{integration.icon}
										</span>
										<div>
											<div className="flex items-center gap-2">
												<h3 className="font-semibold text-lg">
													{integration.name}
												</h3>
												<span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
													Available
												</span>
											</div>
											<span className="text-foreground/50 text-sm">
												{integration.category}
											</span>
										</div>
									</div>
									<p className="mb-4 text-foreground/70 text-sm">
										{integration.description}
									</p>
									<ul className="space-y-1">
										{integration.useCases.map((uc) => (
											<li
												key={uc}
												className="flex items-start gap-2 text-foreground/60 text-sm"
											>
												<span className="mt-0.5 text-green-500">
													✓
												</span>
												{uc}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</section>
				)}

				{/* Coming Soon */}
				<section className="mb-16">
					<h2 className="mb-2 font-semibold text-2xl">Coming soon</h2>
					<p className="mb-6 text-foreground/60 text-sm">
						We're building integrations based on what our users need
						most.{" "}
						<Link
							href="/contact"
							className="text-primary hover:underline"
						>
							Tell us what you use
						</Link>{" "}
						and we'll prioritize it.
					</p>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{comingSoon.map((integration) => (
							<div
								key={integration.name}
								className="rounded-xl border bg-card p-6 opacity-80"
							>
								<div className="mb-3 flex items-center gap-3">
									<span className="text-3xl">
										{integration.icon}
									</span>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-lg">
												{integration.name}
											</h3>
											<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
												Soon
											</span>
										</div>
										<span className="text-foreground/50 text-sm">
											{integration.category}
										</span>
									</div>
								</div>
								<p className="mb-4 text-foreground/70 text-sm">
									{integration.description}
								</p>
								<ul className="space-y-1">
									{integration.useCases.map((uc) => (
										<li
											key={uc}
											className="flex items-start gap-2 text-foreground/60 text-sm"
										>
											<span className="mt-0.5 text-muted-foreground">
												→
											</span>
											{uc}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</section>

				{/* CTA */}
				<section className="rounded-2xl bg-primary/5 px-8 py-12 text-center">
					<h2 className="mb-3 font-bold text-2xl">
						Don't see your tool?
					</h2>
					<p className="mx-auto mb-6 max-w-xl text-foreground/70">
						Our webhook API lets you connect {config.appName} to any
						system. Or tell us what integration you need and we'll
						add it.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Link
							href="/contact"
							className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
						>
							Request an integration
						</Link>
						<Link
							href="/auth/signup"
							className="inline-flex h-10 items-center justify-center rounded-lg border px-6 font-medium text-sm transition-colors hover:bg-muted"
						>
							Get started free →
						</Link>
					</div>
				</section>
			</main>
		</>
	);
}
