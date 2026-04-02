import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `ROI Calculator — ${config.appName}`,
	description: `Calculate how much time and money your team saves with ${config.appName}. See your estimated ROI in minutes.`,
	alternates: { canonical: `${siteUrl}/roi-calculator` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/roi-calculator`,
		title: `ROI Calculator — ${config.appName}`,
		description: `Calculate how much time and money your team saves with ${config.appName}. See your estimated ROI in minutes.`,
		siteName: config.appName,
	},
	twitter: {
		card: "summary_large_image",
		title: `ROI Calculator — ${config.appName}`,
		description: `Calculate how much time and money your team saves with ${config.appName}. See your estimated ROI in minutes.`,
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: `${config.appName} ROI Calculator`,
	url: `${siteUrl}/roi-calculator`,
	description: `Calculate how much time and money your team saves with ${config.appName}. See your estimated ROI in minutes.`,
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	provider: {
		"@type": "Organization",
		name: config.appName,
		url: siteUrl,
	},
};

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: [
		{
			"@type": "Question",
			name: `How much time can I save with ${config.appName}?`,
			acceptedAnswer: {
				"@type": "Answer",
				text: "Most users save 5–20 hours per month depending on how many AI tools they use. Use the calculator to see a personalized estimate based on your specific use cases.",
			},
		},
		{
			"@type": "Question",
			name: "How is the ROI calculated?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "We multiply the hours saved per task by your hourly rate to compute monthly dollar savings, then subtract the cost of the plan. The result is your estimated net monthly savings.",
			},
		},
		{
			"@type": "Question",
			name: "Is the ROI Calculator free to use?",
			acceptedAnswer: {
				"@type": "Answer",
				text: "Yes, the ROI Calculator is completely free. No account required.",
			},
		},
	],
};

export default function RoiCalculatorLayout({
	children,
}: {
	children: ReactNode;
}) {
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
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
			/>
			{children}
		</>
	);
}
