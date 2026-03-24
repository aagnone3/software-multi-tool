import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

const siteUrl = getBaseUrl();

interface IndustryPage {
	slug: string;
	title: string;
	headline: string;
	description: string;
	persona: string;
	challenge: string;
	tools: {
		slug: string;
		name: string;
		how: string;
	}[];
	benefits: string[];
	testimonial: {
		quote: string;
		name: string;
		role: string;
	};
	cta: string;
}

const INDUSTRIES: Record<string, IndustryPage> = {
	accountants: {
		slug: "accountants",
		title: "AI Tools for Accountants",
		headline: "Automate the Busywork. Focus on Advisory Work.",
		description:
			"Stop spending billable hours on manual data entry. Let AI extract invoice data, categorize expenses, and process financial documents in seconds.",
		persona: "Accountants & Bookkeepers",
		challenge:
			"Accountants spend 30–40% of their time on manual data extraction from invoices, receipts, and expense reports — time that could be spent on higher-value advisory work.",
		tools: [
			{
				slug: "invoice-processor",
				name: "Invoice Processor",
				how: "Upload PDFs and images — AI extracts vendor, amount, line items, and due dates automatically, eliminating manual data entry.",
			},
			{
				slug: "expense-categorizer",
				name: "Expense Categorizer",
				how: "Feed in CSV or XLSX bank exports and get categorized expense summaries, budget variance reports, and anomaly flags in seconds.",
			},
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Review client contracts for payment terms, late fees, and scope clauses without reading the entire document line by line.",
			},
		],
		benefits: [
			"Cut invoice data entry time by 80%",
			"Process expense reports in minutes instead of hours",
			"Spot duplicate invoices and billing errors automatically",
			"Scale your client load without adding headcount",
			"Bill more advisory hours by automating manual review",
		],
		testimonial: {
			quote: "Invoice processing used to be my biggest time sink every month. Now I just upload the PDFs and the AI extracts everything accurately. I've reclaimed nearly 10 hours per month.",
			name: "Marcus Rivera",
			role: "Freelance Accountant",
		},
		cta: "Start Saving Time on Accounting Tasks",
	},
	lawyers: {
		slug: "lawyers",
		title: "AI Contract Review Tools for Lawyers & Legal Professionals",
		headline: "First-Pass Contract Review in Seconds, Not Hours.",
		description:
			"AI-assisted contract analysis that flags risky clauses, extracts key terms, and summarizes obligations — so attorneys can focus on judgment, not reading.",
		persona: "Attorneys, Paralegals & Legal Assistants",
		challenge:
			"Legal professionals spend enormous time on first-pass contract review — extracting payment terms, spotting unusual clauses, and summarizing obligations before senior attorney review.",
		tools: [
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Run any contract through AI to surface key terms, risky clauses, payment obligations, and unusual language in a structured summary.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Convert client call recordings or deposition transcripts into structured summaries with decisions and action items.",
			},
			{
				slug: "speaker-separation",
				name: "Speaker Separation",
				how: "Label and separate speakers in recorded depositions, hearings, or client interviews for clean, attributable transcripts.",
			},
		],
		benefits: [
			"Cut first-pass contract review time by 70%",
			"Never miss a key clause or unusual term",
			"Produce consistent contract summaries for every matter",
			"Enable paralegals to do higher-quality preliminary reviews",
			"Handle more client intake without sacrificing quality",
		],
		testimonial: {
			quote: "Contract analysis used to require senior attorney time just for initial review. Now I run contracts through the AI first to flag key clauses. It's become an essential part of our intake process.",
			name: "David Kim",
			role: "Legal Assistant, Harmon & Associates",
		},
		cta: "Start Reviewing Contracts Faster",
	},
	freelancers: {
		slug: "freelancers",
		title: "AI Productivity Tools for Freelancers",
		headline: "Spend Less Time on Admin. Earn More on Actual Work.",
		description:
			"Automate the paperwork that eats into your billable hours — invoice processing, contract review, expense tracking, and client meeting summaries.",
		persona: "Freelancers & Independent Contractors",
		challenge:
			"Freelancers waste 5–10 hours per week on administrative tasks — processing invoices, reviewing client contracts, tracking expenses, and writing up meeting notes.",
		tools: [
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Upload client call recordings and get structured summaries with decisions, deliverables, and action items — no more manual notes.",
			},
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Review client contracts before signing to spot unusual payment terms, IP clauses, or scope creep language without legal consultation.",
			},
			{
				slug: "expense-categorizer",
				name: "Expense Categorizer",
				how: "Categorize your business expenses for quarterly tax prep in minutes instead of a weekend of spreadsheet work.",
			},
		],
		benefits: [
			"Reclaim 5+ hours per week from admin tasks",
			"Never miss a client commitment from a meeting",
			"Review contracts confidently before signing",
			"Tax prep your expenses in minutes every quarter",
			"Look more professional with structured meeting summaries",
		],
		testimonial: {
			quote: "I'm not a tech person, but this platform is genuinely easy to use. The expense categorizer saves me a weekend every quarter and I actually understand my spending now.",
			name: "Amanda Torres",
			role: "Small Business Owner",
		},
		cta: "Automate Your Freelance Admin",
	},
	"small-businesses": {
		slug: "small-businesses",
		title: "AI Tools for Small Businesses",
		headline: "Enterprise-Grade AI. Small Business Price.",
		description:
			"The same document intelligence that large enterprises use — now accessible without the enterprise price tag or IT department.",
		persona: "Small Business Owners & Operations Teams",
		challenge:
			"Small businesses lack the dedicated staff to process mountains of invoices, contracts, meeting notes, and expense reports efficiently — leading to errors, delays, and lost time.",
		tools: [
			{
				slug: "invoice-processor",
				name: "Invoice Processor",
				how: "Process stacks of invoices in bulk, extracting structured data without manual keying or expensive AP software.",
			},
			{
				slug: "feedback-analyzer",
				name: "Feedback Analyzer",
				how: "Analyze customer reviews, surveys, and support tickets to surface recurring issues and sentiment trends at scale.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Turn every team meeting into a structured record of decisions and action items — without a dedicated note-taker.",
			},
		],
		benefits: [
			"Save 10+ hours per week on document processing",
			"Reduce data entry errors that cost money",
			"Make faster decisions with structured data from your documents",
			"Scale operations without hiring more admin staff",
			"Compete with larger businesses through AI automation",
		],
		testimonial: {
			quote: "The meeting summarizer has transformed how we handle client calls. What used to take 2 hours of manual notes now takes 5 minutes. Our team is more productive and nothing falls through the cracks.",
			name: "Sarah Chen",
			role: "Operations Manager, Bright Path Consulting",
		},
		cta: "Automate Your Business Workflows",
	},
	"podcast-producers": {
		slug: "podcast-producers",
		title: "AI Audio Tools for Podcast Producers",
		headline: "Clean Transcripts. Labeled Speakers. Faster Editing.",
		description:
			"Automatically separate speakers, generate timestamped transcripts, and create episode summaries — cutting post-production time in half.",
		persona: "Podcast Producers, Journalists & Content Creators",
		challenge:
			"Podcast production is bottlenecked by manual transcript cleanup, speaker identification, and episode summary writing — all before the actual editing even begins.",
		tools: [
			{
				slug: "speaker-separation",
				name: "Speaker Separation",
				how: "Upload raw interview or episode recordings and get back clean, labeled transcripts with each speaker's words attributed correctly.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Generate structured episode summaries with key topics, quotes, and timestamps — perfect for show notes or SEO metadata.",
			},
			{
				slug: "news-analyzer",
				name: "News Analyzer",
				how: "Research guest topics by analyzing recent news coverage and extracting key angles, sentiment, and talking points.",
			},
		],
		benefits: [
			"Cut post-production transcript time by 80%",
			"Publish show notes faster with AI episode summaries",
			"Improve transcript accuracy for multi-host formats",
			"Research guest topics with automated news analysis",
			"Create accessible content with reliable speaker attribution",
		],
		testimonial: {
			quote: "Speaker separation is incredibly accurate. I run raw interview recordings through it and get clean, labeled transcripts in minutes. My editing workflow has never been smoother.",
			name: "James Whitfield",
			role: "Podcast Producer, Clear Signal Media",
		},
		cta: "Speed Up Your Podcast Workflow",
	},
	consultants: {
		slug: "consultants",
		title: "AI Tools for Consultants",
		headline: "Deliver Client Insights Faster. Win More Engagements.",
		description:
			"Consultants use AI to analyze client documents, summarize meetings, and produce polished deliverables in a fraction of the time.",
		persona:
			"Management Consultants, Strategy Advisors & Business Analysts",
		challenge:
			"Consultants spend too much time on document analysis, meeting notes, and client reports — time that should go toward strategic thinking and client relationships.",
		tools: [
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Review client agreements, vendor contracts, and SOWs instantly to surface risk, obligations, and key terms without reading line by line.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Turn discovery calls and workshop recordings into structured summaries with action items, decisions, and key insights.",
			},
			{
				slug: "feedback-analyzer",
				name: "Feedback Analyzer",
				how: "Analyze client survey responses and stakeholder feedback to identify recurring themes, sentiment, and priority issues.",
			},
		],
		benefits: [
			"Deliver client meeting summaries within minutes of every call",
			"Reduce contract review time from hours to minutes",
			"Extract key themes from stakeholder interviews automatically",
			"Win more pitches with faster, better-prepared deliverables",
			"Scale your practice without hiring more analysts",
		],
		testimonial: {
			quote: "I use the contract analyzer before every client kickoff. It catches scope issues I might have missed and saves me from awkward billing conversations later.",
			name: "Marcus Reid",
			role: "Independent Strategy Consultant",
		},
		cta: "Sharpen Your Consulting Practice",
	},
	"hr-teams": {
		slug: "hr-teams",
		title: "AI Tools for HR Teams",
		headline: "Automate Paperwork. Focus on People.",
		description:
			"HR teams use AI to analyze employee feedback, review employment contracts, summarize interview recordings, and process policy documents faster.",
		persona: "HR Managers, People Ops & Talent Teams",
		challenge:
			"HR teams are buried in documents — offer letters, policy reviews, interview notes, exit surveys, and engagement data — leaving little time for the human side of the work.",
		tools: [
			{
				slug: "feedback-analyzer",
				name: "Feedback Analyzer",
				how: "Analyze employee engagement surveys, exit interview responses, and team pulse checks to identify patterns and actionable insights.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Summarize interview recordings, performance review discussions, and all-hands meetings with structured notes and key takeaways.",
			},
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Review employment agreements, contractor SOWs, and vendor contracts for non-standard terms, obligations, and missing clauses.",
			},
		],
		benefits: [
			"Surface employee sentiment trends from survey data in seconds",
			"Reduce time spent writing interview notes by 70%",
			"Catch problematic contract clauses before they become HR issues",
			"Scale onboarding documentation review across multiple hires",
			"Spend more time on people, less time on paperwork",
		],
		testimonial: {
			quote: "We run every exit interview through the feedback analyzer. It's helped us spot recurring themes we were missing manually, and we've made real process improvements as a result.",
			name: "Priya Nair",
			role: "Head of People Operations, Meridian Tech",
		},
		cta: "Modernize Your HR Workflows",
	},
	"real-estate": {
		slug: "real-estate",
		title: "AI Tools for Real Estate Professionals",
		headline: "Review Contracts Faster. Close More Deals.",
		description:
			"Real estate agents and brokers use AI to review purchase agreements, summarize inspection reports, and analyze market news in minutes.",
		persona: "Real Estate Agents, Brokers & Property Managers",
		challenge:
			"Real estate transactions involve mountains of paperwork — purchase agreements, lease contracts, disclosure documents, and inspection reports — all requiring careful review under time pressure.",
		tools: [
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				how: "Review purchase agreements, lease terms, and disclosure documents to surface contingencies, deadlines, and non-standard clauses instantly.",
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				how: "Summarize client calls, showing notes, and property walkthroughs so nothing important falls through the cracks.",
			},
			{
				slug: "news-analyzer",
				name: "News Analyzer",
				how: "Stay ahead of market shifts by analyzing real estate news, rate announcements, and local market coverage with AI-extracted insights.",
			},
		],
		benefits: [
			"Review purchase agreements in minutes instead of hours",
			"Never miss a contingency deadline or key contract term",
			"Brief clients accurately using AI-generated document summaries",
			"Stay ahead of market trends with automated news analysis",
			"Handle more transactions simultaneously without missing details",
		],
		testimonial: {
			quote: "I run every offer contract through the analyzer before presenting to my clients. It catches things I'd normally have to call my attorney about, and it's saved me real money.",
			name: "Teresa Fontaine",
			role: "Licensed Real Estate Agent, Summit Realty Group",
		},
		cta: "Close Deals Faster with AI",
	},
};

export function generateStaticParams() {
	return Object.keys(INDUSTRIES).map((slug) => ({ industry: slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ industry: string }>;
}): Promise<Metadata> {
	const { industry } = await params;
	const page = INDUSTRIES[industry];
	if (!page) {
		return {};
	}

	return {
		title: `${page.title} — ${config.appName}`,
		description: page.description,
		alternates: {
			canonical: `${siteUrl}/for/${industry}`,
		},
		openGraph: {
			type: "website",
			url: `${siteUrl}/for/${industry}`,
			title: `${page.title} — ${config.appName}`,
			description: page.description,
			images: [
				{
					url: `${siteUrl}/api/og?title=${encodeURIComponent(page.title)}`,
					width: 1200,
					height: 630,
					alt: page.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${page.title} — ${config.appName}`,
			description: page.description,
			images: [
				`${siteUrl}/api/og?title=${encodeURIComponent(page.title)}`,
			],
		},
	};
}

export default async function IndustryPage({
	params,
}: {
	params: Promise<{ industry: string }>;
}) {
	const { industry } = await params;
	const page = INDUSTRIES[industry];
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
				name: `For ${page.persona}`,
				item: `${siteUrl}/for/${industry}`,
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>

			<div className="min-h-screen bg-background">
				{/* Hero */}
				<section className="border-b bg-gradient-to-b from-muted/40 to-background px-4 py-20 text-center">
					<div className="mx-auto max-w-3xl">
						<span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
							Built for {page.persona}
						</span>
						<h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
							{page.headline}
						</h1>
						<p className="mb-8 text-lg text-muted-foreground">
							{page.description}
						</p>
						<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
							<Link
								href="/auth/signup"
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
							>
								{page.cta}{" "}
								<ArrowRightIcon className="h-4 w-4" />
							</Link>
							<Link
								href="/tools"
								className="inline-flex items-center rounded-lg border px-6 py-3 font-medium transition-colors hover:bg-muted"
							>
								Browse all tools
							</Link>
						</div>
					</div>
				</section>

				{/* Challenge */}
				<section className="border-b px-4 py-16">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="mb-4 font-bold text-2xl md:text-3xl">
							The problem with manual document work
						</h2>
						<p className="text-lg text-muted-foreground">
							{page.challenge}
						</p>
					</div>
				</section>

				{/* Tools */}
				<section className="px-4 py-16">
					<div className="mx-auto max-w-4xl">
						<h2 className="mb-10 text-center font-bold text-2xl md:text-3xl">
							How {config.appName} helps {page.persona}
						</h2>
						<div className="space-y-8">
							{page.tools.map((tool) => (
								<div
									key={tool.slug}
									className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-start"
								>
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
										{tool.name[0]}
									</div>
									<div className="flex-1">
										<h3 className="mb-2 font-semibold text-lg">
											{tool.name}
										</h3>
										<p className="mb-3 text-muted-foreground text-sm">
											{tool.how}
										</p>
										<Link
											href={`/tools/${tool.slug}`}
											className="font-medium text-primary text-sm hover:underline"
										>
											Learn more →
										</Link>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Benefits */}
				<section className="border-y bg-muted/30 px-4 py-16">
					<div className="mx-auto max-w-3xl">
						<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
							What you gain
						</h2>
						<ul className="space-y-4">
							{page.benefits.map((benefit) => (
								<li
									key={benefit}
									className="flex items-start gap-3"
								>
									<CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
									<span>{benefit}</span>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Testimonial */}
				<section className="px-4 py-16">
					<div className="mx-auto max-w-2xl text-center">
						<blockquote className="mb-6 text-lg italic text-foreground/80">
							&ldquo;{page.testimonial.quote}&rdquo;
						</blockquote>
						<div className="flex items-center justify-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
								{page.testimonial.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</div>
							<div className="text-left">
								<p className="font-semibold text-sm">
									{page.testimonial.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{page.testimonial.role}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* CTA */}
				<section className="border-t bg-muted/20 px-4 py-16 text-center">
					<div className="mx-auto max-w-2xl">
						<h2 className="mb-4 font-bold text-3xl">
							Ready to get started?
						</h2>
						<p className="mb-8 text-muted-foreground text-lg">
							Free credits on signup. No credit card required.
						</p>
						<Link
							href="/auth/signup"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							{page.cta} <ArrowRightIcon className="h-4 w-4" />
						</Link>
					</div>
				</section>
			</div>
		</>
	);
}
