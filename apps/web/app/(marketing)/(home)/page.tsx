import { BeforeAfter } from "@marketing/home/components/BeforeAfter";
import { ExitIntentModal } from "@marketing/home/components/ExitIntentModal";
import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCta } from "@marketing/home/components/FinalCta";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PricingSection } from "@marketing/home/components/PricingSection";
import { SocialProofBar } from "@marketing/home/components/SocialProofBar";
import { StatsBar } from "@marketing/home/components/StatsBar";
import { StickyCta } from "@marketing/home/components/StickyCta";
import { Testimonials } from "@marketing/home/components/Testimonials";
import { WhoIsItFor } from "@marketing/home/components/WhoIsItFor";
import { config } from "@repo/config";
import type { Metadata } from "next";
import React from "react";

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://softwaremultitool.com";

export const metadata: Metadata = {
	title: `${config.appName} — AI Tools for Small Businesses`,
	description:
		config.appDescription ??
		"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, separate speakers, and more — all in one platform.",
	alternates: {
		canonical: siteUrl,
	},
	openGraph: {
		type: "website",
		url: siteUrl,
		title: `${config.appName} — AI Tools for Small Businesses`,
		description:
			config.appDescription ??
			"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, separate speakers, and more — all in one platform.",
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`${config.appName} — AI Tools for Small Businesses`)}`,
				width: 1200,
				height: 630,
				alt: `${config.appName} — AI Tools for Small Businesses`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `${config.appName} — AI Tools for Small Businesses`,
		description:
			config.appDescription ??
			"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, and more.",
		images: [
			`${siteUrl}/api/og?title=${encodeURIComponent(`${config.appName} — AI Tools for Small Businesses`)}`,
		],
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: config.appName,
	description:
		config.appDescription ??
		"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, separate speakers, and more — all in one platform.",
	url: siteUrl,
	potentialAction: {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: `${siteUrl}/app/tools?q={search_term_string}`,
		},
		"query-input": "required name=search_term_string",
	},
};

const orgJsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: config.appName,
	url: siteUrl,
	logo: {
		"@type": "ImageObject",
		url: `${siteUrl}/logo.png`,
		width: 512,
		height: 512,
	},
	description:
		config.appDescription ?? "AI-powered business tools for small teams.",
	contactPoint: {
		"@type": "ContactPoint",
		contactType: "customer support",
		url: `${siteUrl}/contact`,
	},
};

const softwareAppJsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: config.appName,
	url: siteUrl,
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
		description:
			"10 free credits included on signup. No credit card required.",
	},
	description:
		config.appDescription ??
		"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, separate speakers, and more.",
	featureList: [
		"Meeting summarizer",
		"Contract analyzer",
		"Invoice processor",
		"Customer feedback analyzer",
		"Expense categorizer",
		"Speaker separation",
		"News analyzer",
	],
};

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: [
		{
			"@type": "Question",
			name: "Do you offer a free trial?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Yes — every new account gets 10 free credits to try the tools with no credit card required. You can analyze documents, process audio, and run AI workflows before spending a cent.",
			},
		},
		{
			"@type": "Question",
			name: "How does credit-based pricing work?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Each AI tool consumes a small number of credits per run. Credits never expire, so you only pay for what you use. Purchase additional credit packs any time from your account dashboard.",
			},
		},
		{
			"@type": "Question",
			name: "What file types are supported?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Most tools accept PDF, DOCX, TXT, CSV, XLSX, MP3, MP4, and WAV files. File size limits and supported MIME types are shown on each tool's page before you upload.",
			},
		},
		{
			"@type": "Question",
			name: "Can I use the tools for my whole team?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Yes. Upgrade to a team plan to invite members to a shared organization, pool credits, and manage access from one billing account.",
			},
		},
		{
			"@type": "Question",
			name: "How do I cancel my subscription?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Cancel any time from the Billing section in your account settings. Your credits and active plan remain available through the end of the billing period.",
			},
		},
		{
			"@type": "Question",
			name: "Is my data kept private?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Files you upload are processed to generate your results and are not used to train AI models. Documents are deleted from our servers after processing completes.",
			},
		},
	],
};

export default async function Home() {
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareAppJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
			/>
			<ExitIntentModal />
			<StickyCta />
			<Hero />
			<SocialProofBar />
			<StatsBar />
			<WhoIsItFor />
			<BeforeAfter />
			<Features />
			<HowItWorks />
			<Testimonials />
			<PricingSection />
			<FaqSection />
			<FinalCta />
		</>
	);
}
