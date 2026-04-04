import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Changelog — What's New | ${config.appName}`,
	description: `Stay up to date with the latest improvements, new AI tools, and features added to ${config.appName}. New releases every month.`,
	alternates: { canonical: `${siteUrl}/changelog` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/changelog`,
		title: `Changelog — What's New | ${config.appName}`,
		description: `New features, AI tool updates, and improvements to ${config.appName}. See what we've shipped recently.`,
		siteName: config.appName,
	},
	twitter: {
		card: "summary_large_image",
		title: `Changelog — What's New | ${config.appName}`,
		description: `New features, AI tool updates, and improvements to ${config.appName}. See what we've shipped recently.`,
	},
};

const releases = [
	{
		version: "1.5.0",
		date: "April 2026",
		highlights: "Monetization, analytics & accessibility pass",
		changes: [
			{
				type: "improvement" as const,
				text: "Starter→Pro upgrade nudges added to every high-traffic surface: dashboard, billing settings, empty states, post-job prompts, credit banners, and history pages",
			},
			{
				type: "improvement" as const,
				text: "Annual billing upsell card in billing settings for Pro monthly subscribers — shows computed savings and switch-to-annual CTA",
			},
			{
				type: "feature" as const,
				text: "PaymentIssueAlert surfaces subscription payment failures (past_due, unpaid, paused) on dashboard and billing settings to reduce involuntary churn",
			},
			{
				type: "feature" as const,
				text: "Win-back nudge in billing settings for canceled or expired subscriptions",
			},
			{
				type: "feature" as const,
				text: "Usage overage nudge in UsageSummaryCards: Starter/Free users with overage charges see a quantified Pro upgrade prompt",
			},
			{
				type: "improvement" as const,
				text: "Trust signals (30-day money-back, cancel anytime, secure payment) added to the choose-plan forced conversion gate",
			},
			{
				type: "improvement" as const,
				text: "Comprehensive analytics instrumentation across all conversion surfaces, auth flows, navigation, dashboard widgets, and tool pages — 100+ new tracked events",
			},
			{
				type: "improvement" as const,
				text: "WCAG 2.1 accessibility fixes: aria-labels for icon-only buttons, aria-current for active items, role/label for tables, and accessible password toggle in auth forms",
			},
			{
				type: "improvement" as const,
				text: "Error boundaries added to all major app routes; loading skeletons added to settings, admin, tool, and dashboard routes",
			},
			{
				type: "improvement" as const,
				text: "ToolHistoryPage now uses server-side pagination (20 per page) instead of bulk 100-job fetch",
			},
			{
				type: "fix" as const,
				text: "Fixed hardcoded tool-slug→detail URL maps in ToolRecentRuns and ActiveJobsWidget — all tools now link to the correct job detail page",
			},
			{
				type: "fix" as const,
				text: "Fixed money-back guarantee inconsistency across trust surfaces (standardized to 30-day everywhere)",
			},
			{
				type: "fix" as const,
				text: "Fixed StickyCta and BlogStickyCta showing free-trial copy to Starter plan users who are already paying",
			},
			{
				type: "improvement" as const,
				text: "Pricing FAQ expanded from 6 to 11 entries — covers Starter vs Pro, plan switching, team pricing, file formats, and guarantee",
			},
			{
				type: "improvement" as const,
				text: "SEO: added JSON-LD structured data to /for, /vs, /roi-calculator, and /use-cases pages",
			},
		],
	},
	{
		version: "1.4.0",
		date: "March 2026",
		highlights: "AI-powered dashboard & UX overhaul",
		changes: [
			{
				type: "feature" as const,
				text: "Added personalized dashboard with activity heatmap, streak widget, daily goals, and credit forecasting",
			},
			{
				type: "feature" as const,
				text: "Added job comparison, pinned jobs, job notes, and job tagging to the jobs history page",
			},
			{
				type: "feature" as const,
				text: "Added ToolPreviewDrawer, ToolTipsBanner, ToolUsageGuide, ToolSampleOutput, and ToolBenchmarkWidget",
			},
			{
				type: "feature" as const,
				text: "Added keyboard navigation shortcuts (g+h/t/j/s) and keyboard shortcuts help dialog (?)",
			},
			{
				type: "feature" as const,
				text: "Added searchable, filterable, and sortable ToolsGrid with favorites and tool collections",
			},
			{
				type: "feature" as const,
				text: "Added milestone notifications, job completion toasts, and credit alert settings",
			},
			{
				type: "improvement" as const,
				text: "Redesigned job detail page with output viewer, run-again action, and auto-polling",
			},
			{
				type: "improvement" as const,
				text: "Bulk select and delete jobs from the jobs history page",
			},
		],
	},
	{
		version: "1.3.0",
		date: "March 2026",
		highlights: "SEO & marketing pages",
		changes: [
			{
				type: "feature" as const,
				text: "Added public marketing landing pages for each AI tool with hero, features, use-cases, and JSON-LD structured data",
			},
			{
				type: "feature" as const,
				text: "Added dynamic OG image generation endpoint for social sharing",
			},
			{
				type: "feature" as const,
				text: "Added BreadcrumbList, FAQPage, and Article JSON-LD structured data throughout the site",
			},
			{
				type: "improvement" as const,
				text: "Updated robots.txt and sitemap.xml to include all public tool pages",
			},
			{
				type: "improvement" as const,
				text: "Added social proof bar and three new blog posts on AI tool use cases",
			},
		],
	},
	{
		version: "1.2.0",
		date: "February 2026",
		highlights: "Test coverage & reliability",
		changes: [
			{
				type: "improvement" as const,
				text: "Added 1,900+ automated tests across web, API, database, storage, and mail packages",
			},
			{
				type: "improvement" as const,
				text: "Dockerless test runner ergonomics — all tests skip or skip-integrate gracefully when Docker is unavailable",
			},
			{
				type: "improvement" as const,
				text: "Removed host psql dependency from local-eval, setup, and seed flows",
			},
			{
				type: "improvement" as const,
				text: "Significant speedups in test suites via parallelization and shared fixtures",
			},
		],
	},
	{
		version: "1.1.0",
		date: "January 2026",
		highlights: "Local development & onboarding",
		changes: [
			{
				type: "feature" as const,
				text: "Added pnpm local-eval:smoke command for single-command local evaluation",
			},
			{
				type: "improvement" as const,
				text: "Tightened README and CONTRIBUTING docs — local evaluation path now reflects real prerequisites",
			},
			{
				type: "improvement" as const,
				text: "Repo-owned Supabase CLI fallback so global install is optional",
			},
			{
				type: "improvement" as const,
				text: "Added pnpm worktree:create / resume / list / remove for parallel feature development",
			},
		],
	},
	{
		version: "1.0.0",
		date: "December 2025",
		highlights: "Initial launch",
		changes: [
			{
				type: "feature" as const,
				text: "Meeting Summarizer — AI-powered meeting notes and action item extraction",
			},
			{
				type: "feature" as const,
				text: "Invoice Processor — extract line items, totals, and vendor details from invoice PDFs",
			},
			{
				type: "feature" as const,
				text: "Contract Analyzer — identify key clauses, obligations, and risk factors in contracts",
			},
			{
				type: "feature" as const,
				text: "Speaker Separation — diarize audio into per-speaker segments",
			},
			{
				type: "feature" as const,
				text: "News Analyzer — curate and analyze news articles on any topic",
			},
			{
				type: "feature" as const,
				text: "Expense Categorizer — auto-categorize expense CSVs for bookkeeping",
			},
			{
				type: "feature" as const,
				text: "Feedback Analyzer — analyze customer feedback for themes and sentiment",
			},
			{
				type: "feature" as const,
				text: "Credit-based pricing with free tier, Pro plan, and Enterprise plan",
			},
		],
	},
];

const typeBadge: Record<"feature" | "improvement" | "fix", string> = {
	feature:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	improvement:
		"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	fix: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const typeLabel: Record<"feature" | "improvement" | "fix", string> = {
	feature: "New",
	improvement: "Improved",
	fix: "Fixed",
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: config.appName,
	url: siteUrl,
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web",
	description: `AI-powered productivity tools for small businesses — ${config.appName} changelog.`,
	softwareVersion: releases[0]?.version,
	releaseNotes: `${siteUrl}/changelog`,
	provider: {
		"@type": "Organization",
		name: config.appName,
		url: siteUrl,
	},
};

export default function ChangelogPage() {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<div className="container mx-auto max-w-3xl px-4 py-16">
				<div className="mb-12">
					<h1 className="mb-4 font-bold text-4xl">Changelog</h1>
					<p className="text-lg text-muted-foreground">
						All notable changes to {config.appName} are documented
						here.
					</p>
				</div>

				<div className="space-y-16">
					{releases.map((release) => (
						<div key={release.version} className="relative">
							<div className="mb-6 flex flex-wrap items-baseline gap-3">
								<span className="rounded-full bg-primary px-3 py-1 font-mono font-semibold text-primary-foreground text-sm">
									v{release.version}
								</span>
								<span className="text-muted-foreground text-sm">
									{release.date}
								</span>
								<span className="font-medium text-foreground">
									{release.highlights}
								</span>
							</div>

							<ul className="space-y-3">
								{release.changes.map((change) => (
									<li
										key={change.text}
										className="flex items-start gap-3 text-sm"
									>
										<span
											className={`mt-0.5 inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-medium text-xs ${typeBadge[change.type]}`}
										>
											{typeLabel[change.type]}
										</span>
										<span className="text-foreground/80">
											{change.text}
										</span>
									</li>
								))}
							</ul>

							<div className="mt-8 border-b" />
						</div>
					))}
				</div>
			</div>
		</>
	);
}
