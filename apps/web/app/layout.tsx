import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { Montserrat } from "next/font/google";

const sansFont = Montserrat({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

const description =
	config.appDescription ??
	"AI-powered business tools for small teams. Summarize meetings, process invoices, analyze contracts, and more.";

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://softwaremultitool.com";

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
	description,
	keywords: [
		"AI tools",
		"small business",
		"meeting summarizer",
		"invoice processor",
		"contract analyzer",
		"speaker separation",
		"document processing",
		"AI productivity",
	],
	authors: [{ name: config.appName }],
	creator: config.appName,
	openGraph: {
		type: "website",
		url: siteUrl,
		siteName: config.appName,
		title: config.appName,
		description,
		images: [
			{
				url: `${siteUrl}/api/og`,
				width: 1200,
				height: 630,
				alt: config.appName,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: config.appName,
		description,
		images: [`${siteUrl}/api/og`],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="en" suppressHydrationWarning className={sansFont.className}>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				{children}
			</body>
		</html>
	);
}
