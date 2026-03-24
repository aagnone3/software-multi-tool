import { PricingSection } from "@marketing/home/components/PricingSection";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import {
	CheckCircleIcon,
	HelpCircleIcon,
	ShieldCheckIcon,
	ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Pricing — ${config.appName}`,
	description: `Simple, transparent pricing for ${config.appName}. Start free, upgrade when you need more. No hidden fees, no long-term contracts.`,
	alternates: { canonical: `${siteUrl}/pricing` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/pricing`,
		title: `Pricing — ${config.appName}`,
		description: `Simple, transparent pricing for ${config.appName}. Start free, upgrade when you need more.`,
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`Pricing — ${config.appName}`)}&description=${encodeURIComponent("Start free, upgrade when you need more. No hidden fees.")}`,
				width: 1200,
				height: 630,
				alt: `Pricing — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Pricing — ${config.appName}`,
		description: `Simple, transparent pricing for ${config.appName}. Start free, upgrade when you need more.`,
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
		a: "Yes. Every new account gets free credits to try any tool. No credit card required to sign up.",
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
			<main>
				{/* Hero */}
				<section className="container pt-32 pb-8 text-center md:pt-40">
					<h1 className="mx-auto max-w-3xl font-bold text-4xl leading-tight md:text-5xl">
						Simple, transparent pricing
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-foreground/70 text-lg">
						Start free. Upgrade when you need more. No hidden fees,
						no long-term contracts.
					</p>
				</section>

				{/* Trust badges */}
				<section className="container pb-8">
					<div className="flex flex-wrap items-center justify-center gap-6 text-foreground/60 text-sm">
						{[
							{
								icon: ZapIcon,
								text: "Free credits on signup",
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

				{/* Pricing table */}
				<PricingSection />

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
		</>
	);
}
