import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

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

export default function RoiCalculatorLayout({
	children,
}: {
	children: ReactNode;
}) {
	return children;
}
