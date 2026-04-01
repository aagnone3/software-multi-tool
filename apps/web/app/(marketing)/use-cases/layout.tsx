import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Use Cases — ${config.appName}`,
	description: `See how businesses use ${config.appName} to automate contracts, invoices, meetings, expenses, and more. Real workflows, real time savings.`,
	alternates: { canonical: `${siteUrl}/use-cases` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/use-cases`,
		title: `Use Cases — ${config.appName}`,
		description: `See how businesses use ${config.appName} to automate contracts, invoices, meetings, expenses, and more. Real workflows, real time savings.`,
		siteName: config.appName,
	},
	twitter: {
		card: "summary_large_image",
		title: `Use Cases — ${config.appName}`,
		description: `See how businesses use ${config.appName} to automate contracts, invoices, meetings, expenses, and more.`,
	},
};

export default function UseCasesLayout({ children }: { children: ReactNode }) {
	return children;
}
