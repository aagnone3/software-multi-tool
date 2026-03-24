import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import {
	ArrowRightIcon,
	BarChart3Icon,
	BriefcaseIcon,
	BuildingIcon,
	ClockIcon,
	QuoteIcon,
	StarIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Customer Success Stories — ${config.appName}`,
	description: `See how small businesses and teams use ${config.appName} to save hours every week. Real results from real customers across consulting, legal, real estate, and more.`,
	alternates: { canonical: `${siteUrl}/case-studies` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/case-studies`,
		title: `Customer Success Stories — ${config.appName}`,
		description:
			"Real results from real customers. See how teams save 10+ hours per week with AI-powered business tools.",
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent("Customer Success Stories")}&description=${encodeURIComponent("Real results from real customers")}`,
				width: 1200,
				height: 630,
				alt: `Customer Success Stories — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Customer Success Stories — ${config.appName}`,
		description:
			"Real results from real customers. See how teams save 10+ hours per week with AI-powered business tools.",
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
			name: "Case Studies",
			item: `${siteUrl}/case-studies`,
		},
	],
};

const caseStudies = [
	{
		id: "boutique-law-firm",
		industry: "Legal",
		company: "Boutique Law Firm",
		size: "8 attorneys",
		icon: BriefcaseIcon,
		challenge:
			"Attorneys were spending 2–3 hours per contract manually reviewing terms and flagging risks before client calls.",
		solution: "Contract Analyzer",
		toolSlug: "contract-analyzer",
		results: [
			{ metric: "Time saved per contract", value: "2+ hours" },
			{ metric: "Contracts reviewed per week", value: "3× more" },
			{ metric: "Client satisfaction score", value: "+18%" },
		],
		quote: "We used to dread the pre-call contract prep. Now we upload the PDF and get a structured risk summary in under a minute. It's changed how we work.",
		author: "Managing Partner",
		highlight: "Reduced contract review time by 80%",
		color: "blue",
	},
	{
		id: "consulting-firm",
		industry: "Consulting",
		company: "Strategy Consulting Firm",
		size: "15 consultants",
		icon: UsersIcon,
		challenge:
			"Post-meeting documentation was consuming 45+ minutes per meeting. Consultants were missing action items in follow-ups.",
		solution: "Meeting Summarizer",
		toolSlug: "meeting-summarizer",
		results: [
			{ metric: "Time saved per meeting", value: "40 minutes" },
			{ metric: "Action items captured", value: "95% accuracy" },
			{ metric: "Weekly hours saved (firm-wide)", value: "22+ hours" },
		],
		quote: "Our consultants were spending as much time on meeting notes as they were on actual strategy. The Meeting Summarizer paid for itself in the first week.",
		author: "Operations Director",
		highlight: "22+ hours saved per week firm-wide",
		color: "green",
	},
	{
		id: "real-estate-agency",
		industry: "Real Estate",
		company: "Regional Real Estate Agency",
		size: "12 agents",
		icon: BuildingIcon,
		challenge:
			"Agents were processing 30–50 expense receipts per month manually, leading to delayed reimbursements and accounting errors.",
		solution: "Expense Categorizer",
		toolSlug: "expense-categorizer",
		results: [
			{ metric: "Expense processing time", value: "Down 85%" },
			{ metric: "Accounting errors per quarter", value: "Eliminated" },
			{ metric: "Reimbursement cycle", value: "Same day" },
		],
		quote: "We went from dreading month-end expense reports to having them done in 20 minutes. The categorization is spot-on for real estate expenses.",
		author: "Office Manager",
		highlight: "Month-end close cut from 3 days to 4 hours",
		color: "orange",
	},
	{
		id: "podcast-production",
		industry: "Media / Podcasting",
		company: "Independent Podcast Network",
		size: "3 producers",
		icon: BarChart3Icon,
		challenge:
			"Each 60-minute episode required 3–4 hours of manual transcription and speaker labeling before editing could begin.",
		solution: "Speaker Separation",
		toolSlug: "speaker-separation",
		results: [
			{ metric: "Transcription time per episode", value: "15 minutes" },
			{ metric: "Speaker accuracy", value: "94% correct labels" },
			{ metric: "Episodes produced per month", value: "2× increase" },
		],
		quote: "Speaker Separation turned a 4-hour bottleneck into a 15-minute task. We doubled our output without hiring anyone.",
		author: "Head Producer",
		highlight: "Production output doubled in 60 days",
		color: "purple",
	},
	{
		id: "financial-services",
		industry: "Financial Services",
		company: "Independent Financial Advisor",
		size: "Solo practitioner",
		icon: TrendingUpIcon,
		challenge:
			"Processing client invoices and matching them against expense categories took 6+ hours per month — time taken away from client advisory work.",
		solution: "Invoice Processor",
		toolSlug: "invoice-processor",
		results: [
			{ metric: "Monthly invoice processing time", value: "Down 90%" },
			{ metric: "Data entry errors", value: "Eliminated" },
			{ metric: "Additional billable hours recovered", value: "5/month" },
		],
		quote: "As a solo advisor, every hour matters. The Invoice Processor gave me back 5–6 hours a month that I now spend with clients.",
		author: "Independent Financial Advisor",
		highlight: "5–6 billable hours recovered every month",
		color: "teal",
	},
	{
		id: "market-research",
		industry: "Market Research",
		company: "Boutique Research Agency",
		size: "6 analysts",
		icon: BarChart3Icon,
		challenge:
			"Analysts were manually reviewing 20–30 customer feedback surveys per project, which took 4–6 hours to synthesize into themes.",
		solution: "Feedback Analyzer",
		toolSlug: "feedback-analyzer",
		results: [
			{ metric: "Feedback synthesis time", value: "Down 75%" },
			{ metric: "Themes identified per project", value: "2× more" },
			{ metric: "Client report turnaround", value: "Same day" },
		],
		quote: "We can now turn around a 200-response survey analysis in an afternoon. Our clients are stunned by how fast we deliver insights.",
		author: "Senior Research Analyst",
		highlight: "200-response analysis delivered same day",
		color: "pink",
	},
];

const colorMap: Record<
	string,
	{
		badge: string;
		icon: string;
		border: string;
		quote: string;
	}
> = {
	blue: {
		badge: "bg-blue-100 text-blue-700",
		icon: "text-blue-600",
		border: "border-blue-200",
		quote: "text-blue-600",
	},
	green: {
		badge: "bg-green-100 text-green-700",
		icon: "text-green-600",
		border: "border-green-200",
		quote: "text-green-600",
	},
	orange: {
		badge: "bg-orange-100 text-orange-700",
		icon: "text-orange-600",
		border: "border-orange-200",
		quote: "text-orange-600",
	},
	purple: {
		badge: "bg-purple-100 text-purple-700",
		icon: "text-purple-600",
		border: "border-purple-200",
		quote: "text-purple-600",
	},
	teal: {
		badge: "bg-teal-100 text-teal-700",
		icon: "text-teal-600",
		border: "border-teal-200",
		quote: "text-teal-600",
	},
	pink: {
		badge: "bg-pink-100 text-pink-700",
		icon: "text-pink-600",
		border: "border-pink-200",
		quote: "text-pink-600",
	},
};

export default function CaseStudiesPage() {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>
			<main>
				{/* Hero */}
				<section className="container pt-32 pb-12 text-center md:pt-40">
					<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
						<StarIcon className="size-4" />
						Real results from real customers
					</div>
					<h1 className="mx-auto max-w-3xl font-bold text-4xl leading-tight md:text-5xl">
						How teams save{" "}
						<span className="text-primary">10+ hours per week</span>{" "}
						with {config.appName}
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-foreground/70 text-lg">
						From solo consultants to 15-person firms — see the
						concrete results teams achieve when they replace manual
						processes with AI-powered tools.
					</p>
				</section>

				{/* Summary stats */}
				<section className="border-t border-b bg-muted/30 py-10">
					<div className="container">
						<div className="grid gap-6 sm:grid-cols-3 text-center">
							{[
								{
									icon: ClockIcon,
									value: "10–22 hrs",
									label: "Saved per week, per team",
								},
								{
									icon: TrendingUpIcon,
									value: "80–90%",
									label: "Reduction in manual processing time",
								},
								{
									icon: UsersIcon,
									value: "6 industries",
									label: "Legal, consulting, real estate & more",
								},
							].map(({ icon: Icon, value, label }) => (
								<div
									key={label}
									className="flex flex-col items-center gap-2"
								>
									<Icon className="size-6 text-primary" />
									<div className="font-bold text-3xl">
										{value}
									</div>
									<div className="text-foreground/60 text-sm">
										{label}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Case studies */}
				<section className="py-16">
					<div className="container max-w-5xl">
						<div className="space-y-12">
							{caseStudies.map((cs, idx) => {
								const colors =
									colorMap[cs.color] ?? colorMap.blue;
								const isEven = idx % 2 === 0;
								return (
									<article
										key={cs.id}
										className={`rounded-2xl border bg-background p-8 ${colors.border}`}
									>
										<div
											className={`grid gap-8 ${isEven ? "md:grid-cols-[2fr_1fr]" : "md:grid-cols-[1fr_2fr]"}`}
										>
											<div
												className={
													isEven ? "" : "md:order-2"
												}
											>
												<div className="mb-4 flex items-center gap-3">
													<div
														className={`rounded-lg p-2 ${colors.badge}`}
													>
														<cs.icon
															className={`size-5 ${colors.icon}`}
														/>
													</div>
													<div>
														<span
															className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}
														>
															{cs.industry}
														</span>
													</div>
												</div>

												<h2 className="mb-1 font-bold text-xl">
													{cs.company}
												</h2>
												<p className="mb-4 text-foreground/50 text-sm">
													{cs.size} · Used:{" "}
													<Link
														href={`/tools/${cs.toolSlug}`}
														className="font-medium text-primary hover:underline"
													>
														{cs.solution}
													</Link>
												</p>

												<div className="mb-4">
													<h3 className="mb-1 font-semibold text-sm text-foreground/70 uppercase tracking-wide">
														The Challenge
													</h3>
													<p className="text-foreground/80 text-sm leading-relaxed">
														{cs.challenge}
													</p>
												</div>

												<div
													className={`rounded-lg border p-4 ${colors.border} bg-muted/20`}
												>
													<QuoteIcon
														className={`mb-2 size-4 ${colors.quote}`}
													/>
													<blockquote className="text-foreground/80 text-sm italic leading-relaxed">
														&ldquo;{cs.quote}&rdquo;
													</blockquote>
													<p className="mt-2 text-foreground/50 text-xs">
														— {cs.author}
													</p>
												</div>
											</div>

											<div
												className={
													isEven ? "" : "md:order-1"
												}
											>
												<div
													className={`rounded-xl border p-5 ${colors.border} bg-muted/10 h-full`}
												>
													<h3 className="mb-4 font-semibold text-sm text-foreground/70 uppercase tracking-wide">
														Results
													</h3>
													<div className="space-y-4">
														{cs.results.map((r) => (
															<div key={r.metric}>
																<div className="font-bold text-2xl text-foreground">
																	{r.value}
																</div>
																<div className="text-foreground/60 text-sm">
																	{r.metric}
																</div>
															</div>
														))}
													</div>

													<div
														className={`mt-6 rounded-lg px-3 py-2 text-sm font-semibold ${colors.badge}`}
													>
														✓ {cs.highlight}
													</div>

													<Link
														href={`/tools/${cs.toolSlug}`}
														className="mt-4 flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
													>
														Try {cs.solution}
														<ArrowRightIcon className="size-3.5" />
													</Link>
												</div>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					</div>
				</section>

				{/* CTA */}
				<section className="border-t bg-primary py-16 text-primary-foreground">
					<div className="container max-w-2xl text-center">
						<h2 className="mb-4 font-bold text-3xl">
							Ready to write your own success story?
						</h2>
						<p className="mb-8 text-primary-foreground/80">
							Join teams that have already reclaimed hours every
							week. Start free — no credit card required.
						</p>
						<div className="flex flex-wrap justify-center gap-4">
							<Link
								href="/auth/signup"
								className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary shadow-sm hover:bg-white/90 transition-colors"
							>
								Start for free
								<ArrowRightIcon className="size-4" />
							</Link>
							<Link
								href="/pricing"
								className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
							>
								View pricing
							</Link>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
