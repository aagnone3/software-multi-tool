import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCta } from "@marketing/home/components/FinalCta";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PricingSection } from "@marketing/home/components/PricingSection";
import { Testimonials } from "@marketing/home/components/Testimonials";
import { config } from "@repo/config";
import type { Metadata } from "next";

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
				url: `${siteUrl}/og-image.png`,
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
		images: [`${siteUrl}/og-image.png`],
	},
};

export default async function Home() {
	return (
		<>
			<Hero />
			<Features />
			<HowItWorks />
			<Testimonials />
			<PricingSection />
			<FaqSection />
			<FinalCta />
		</>
	);
}
