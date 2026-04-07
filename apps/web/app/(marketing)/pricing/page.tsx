import { PricingSection } from "@marketing/home/components/PricingSection";
import { StickyCta } from "@marketing/home/components/StickyCta";
import { PricingPageTracker } from "@marketing/shared/components/PricingPageTracker";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	BadgeCheckIcon,
	BlocksIcon,
	CheckCircleIcon,
	HelpCircleIcon,
	RocketIcon,
	ShieldCheckIcon,
	SparklesIcon,
	StarIcon,
	ThumbsUpIcon,
	ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();
const liveToolCount = config.tools.registry.filter(
	(tool) => tool.enabled,
).length;
const upcomingToolCount = config.tools.registry.filter(
	(tool) => !tool.enabled,
).length;

export const metadata: Metadata = {
	title: `AI Tools Pricing — Plans & Credits | ${config.appName}`,
	description: `Simple, transparent AI tools pricing. Start with 10 free credits, then upgrade when you need more. No hidden fees, no long-term contracts. Pay-per-use credits for ${liveToolCount} live AI business tools.`,
	alternates: { canonical: `${siteUrl}/pricing` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/pricing`,
		title: `AI Tools Pricing — Plans & Credits | ${config.appName}`,
		description:
			"Simple, transparent AI tools pricing. Start with 10 free credits, then upgrade when you need more.",
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`AI Tools Pricing — ${config.appName}`)}&description=${encodeURIComponent("Start with 10 free credits, then upgrade when you need more. No hidden fees.")}`,
				width: 1200,
				height: 630,
				alt: `AI Tools Pricing — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `AI Tools Pricing — Plans & Credits | ${config.appName}`,
		description:
			"Simple, transparent AI tools pricing. Start with 10 free credits, then upgrade when you need more.",
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
			name: "Pricing",
			item: `${siteUrl}/pricing`,
		},
	],
};

const faqs = [
	{
		q: "Can I try it for free?",
		a: "Yes. Every new account gets 10 free credits to try any tool. No credit card required to sign up.",
	},
	{
		q: "What is a credit?",
		a: "Credits are the currency for running tools. Each tool run costs a fixed number of credits depending on the complexity of the task. You can see the credit cost on each tool's page before you run it.",
	},
	{
		q: "Do credits roll over?",
		a: "Yes. Unused credits from your monthly plan roll over to the next month as long as your subscription is active.",
	},
	{
		q: "What happens if I run out of credits?",
		a: "You can purchase additional credit packs at any time without upgrading your plan. Or you can upgrade to a higher plan for a larger monthly credit allowance.",
	},
	{
		q: "Can I cancel anytime?",
		a: "Yes. You can cancel your subscription at any time. You'll keep access to your plan through the end of the current billing period.",
	},
	{
		q: "Is my data secure?",
		a: "Yes. Files you upload are processed and then deleted. We don't train models on your data. See our privacy policy for details.",
	},
	{
		q: "What's the difference between the Starter and Pro plans?",
		a: "The Starter plan gives you 100 credits per month plus access to all tools, exports, and your usage dashboard. Pro gives you 500 credits per month, rollover credits, job scheduling (run tools automatically on a schedule), bulk actions, and saved input templates — making it the right choice for teams or anyone processing documents regularly.",
	},
	{
		q: "Can I switch plans later?",
		a: "Yes. You can upgrade or downgrade at any time from your billing settings. Upgrades take effect immediately; downgrades take effect at the start of your next billing cycle.",
	},
	{
		q: "Do you offer team or organization pricing?",
		a: "Yes. You can create an organization and invite team members. Each organization has its own credit pool and billing. Contact us if you need a custom plan for a larger team.",
	},
	{
		q: "What file formats do the tools support?",
		a: "It depends on the tool. Most document tools accept PDF, Word (.docx), and plain text. The invoice processor also accepts PNG and JPEG images. The meeting summarizer accepts audio and video files. You can see accepted formats on each tool's page.",
	},
	{
		q: "Is there a money-back guarantee?",
		a: "Yes. If you're not satisfied within the first 30 days of a paid plan, email us and we'll issue a full refund — no questions asked.",
	},
];

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqs.map(({ q, a }) => ({
		"@type": "Question",
		name: q,
		acceptedAnswer: { "@type": "Answer", text: a },
	})),
};

export default function PricingPage() {
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
			<PricingPageTracker />
			<main>
				{/* Hero */}
				<section className="container pt-32 pb-8 text-center md:pt-40">
					<h1 className="mx-auto max-w-3xl font-bold text-4xl leading-tight md:text-5xl">
						AI tools for your business — simple, transparent pricing
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-foreground/70 text-lg">
						Start free. Run your first tool in under a minute.
						Upgrade only when you need more.
					</p>
				</section>

				{/* Trust badges */}
				<section className="container pb-8">
					<div className="flex flex-wrap items-center justify-center gap-6 text-foreground/60 text-sm">
						{[
							{
								icon: ZapIcon,
								text: "10 free credits on signup",
							},
							{
								icon: ShieldCheckIcon,
								text: "No credit card required",
							},
							{
								icon: CheckCircleIcon,
								text: "Cancel anytime",
							},
						].map(({ icon: Icon, text }) => (
							<div key={text} className="flex items-center gap-2">
								<Icon className="size-4 text-primary" />
								<span>{text}</span>
							</div>
						))}
					</div>
				</section>

				{/* Value-anchor strip */}
				<section className="container pb-12">
					<div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
						{[
							{
								icon: SparklesIcon,
								label: `${liveToolCount} live AI tools${upcomingToolCount > 0 ? ` + ${upcomingToolCount} in rollout` : ""}`,
								desc: "Use live tools now and get new workflows as they launch — on the same credit model.",
							},
							{
								icon: RocketIcon,
								label: "Run your first tool in minutes",
								desc: "No setup, no integrations. Sign up and start right away.",
							},
							{
								icon: BlocksIcon,
								label: "Credits never expire",
								desc: "Unused monthly credits roll over as long as your subscription is active.",
							},
						].map(({ icon: Icon, label, desc }) => (
							<div
								key={label}
								className="rounded-lg border bg-background p-5 text-center"
							>
								<Icon className="mx-auto mb-2 size-5 text-primary" />
								<p className="font-semibold text-sm">{label}</p>
								<p className="mt-1 text-foreground/60 text-xs">
									{desc}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* Pricing table */}
				<PricingSection />

				{/* Money-back guarantee / risk-reversal */}
				<section className="container py-12">
					<div className="mx-auto max-w-4xl">
						<div className="grid gap-6 sm:grid-cols-3">
							{[
								{
									icon: ThumbsUpIcon,
									title: "30-day money-back guarantee",
									desc: "Not happy in your first 30 days? Email us and we'll refund your plan purchase, no questions asked.",
								},
								{
									icon: ShieldCheckIcon,
									title: "Your data stays yours",
									desc: "Files you upload are processed and immediately deleted. We never train models on your documents.",
								},
								{
									icon: BadgeCheckIcon,
									title: "Cancel anytime, no lock-in",
									desc: "No long-term contracts. Cancel from your account settings in one click and keep access until the billing period ends.",
								},
							].map(({ icon: Icon, title, desc }) => (
								<div
									key={title}
									className="flex flex-col items-start gap-3 rounded-xl border bg-background p-6"
								>
									<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
										<Icon className="size-5 text-primary" />
									</div>
									<h3 className="font-semibold text-base">
										{title}
									</h3>
									<p className="text-foreground/60 text-sm">
										{desc}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Social proof testimonials */}
				<section className="border-t bg-muted/20 py-12">
					<div className="container max-w-4xl">
						<h2 className="mb-8 text-center font-bold text-2xl">
							What customers say
						</h2>
						<div className="grid gap-6 sm:grid-cols-3">
							{[
								{
									quote: "Saved us 3 hours every Monday morning. The meeting summarizer alone is worth the subscription.",
									name: "Sarah K.",
									role: "Operations Manager",
								},
								{
									quote: "I was skeptical, but the invoice processor paid for itself in the first week. Incredible time saver.",
									name: "Marcus T.",
									role: "Freelance Consultant",
								},
								{
									quote: "We process 50+ contracts a month. The contract analyzer catches things we used to miss completely.",
									name: "Jennifer L.",
									role: "Legal Operations Lead",
								},
							].map(({ quote, name, role }) => (
								<div
									key={name}
									className="flex flex-col gap-4 rounded-xl border bg-background p-6"
								>
									<div className="flex gap-0.5">
										{Array.from({ length: 5 }).map(
											(_, i) => (
												<StarIcon
													key={i}
													className="size-4 fill-amber-400 text-amber-400"
												/>
											),
										)}
									</div>
									<p className="text-foreground/70 text-sm leading-relaxed">
										&ldquo;{quote}&rdquo;
									</p>
									<div>
										<p className="font-semibold text-sm">
											{name}
										</p>
										<p className="text-foreground/50 text-xs">
											{role}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Social proof / founding member */}
				<section className="container py-12">
					<div className="mx-auto max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
						<h2 className="font-bold text-xl">Join early access</h2>
						<p className="mx-auto mt-2 max-w-lg text-foreground/70 text-sm">
							Get founding member pricing — locked in for life
							when you subscribe today.
						</p>
						<Button asChild size="sm" className="mt-5">
							<Link href="/auth/signup">
								Get started free
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					</div>
				</section>

				{/* Credit costs per tool */}
				<section className="border-t py-16">
					<div className="container max-w-3xl">
						<h2 className="mb-4 text-center font-bold text-2xl">
							Credit cost per tool
						</h2>
						<p className="mb-8 text-center text-foreground/60">
							Each tool run costs a fixed number of credits.
							Credits don&apos;t expire while your subscription is
							active.
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							{config.tools.registry
								.filter((t) => t.enabled)
								.map((tool) => (
									<Link
										key={tool.slug}
										href={`/tools/${tool.slug}`}
										className="flex items-center justify-between rounded-lg border bg-background px-4 py-3 transition-colors hover:bg-muted/50"
									>
										<span className="font-medium text-sm">
											{tool.name}
										</span>
										<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary text-xs font-semibold">
											{tool.creditCost} credit
											{tool.creditCost === 1 ? "" : "s"}
										</span>
									</Link>
								))}
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section className="border-t bg-muted/30 py-16">
					<div className="container max-w-2xl">
						<h2 className="mb-8 text-center font-bold text-2xl">
							Frequently asked questions
						</h2>
						<div className="divide-y">
							{faqs.map(({ q, a }) => (
								<div key={q} className="py-6">
									<div className="mb-2 flex items-start gap-3">
										<HelpCircleIcon className="mt-0.5 size-5 shrink-0 text-primary" />
										<h3 className="font-semibold">{q}</h3>
									</div>
									<p className="pl-8 text-foreground/70 text-sm">
										{a}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
			<StickyCta />
		</>
	);
}
