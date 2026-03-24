import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	AudioLinesIcon,
	ClipboardListIcon,
	FileTextIcon,
	ImageMinusIcon,
	NewspaperIcon,
	ReceiptIcon,
	SeparatorHorizontalIcon,
	SparklesIcon,
	WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `AI Tools for Small Businesses — ${config.appName}`,
	description:
		"Explore our full suite of AI-powered business tools. Summarize meetings, process invoices, analyze contracts, separate speakers, and more.",
	alternates: {
		canonical: `${siteUrl}/tools`,
	},
	openGraph: {
		type: "website",
		url: `${siteUrl}/tools`,
		title: `AI Tools for Small Businesses — ${config.appName}`,
		description:
			"Explore our full suite of AI-powered business tools. Summarize meetings, process invoices, analyze contracts, separate speakers, and more.",
		images: [
			{
				url: `${siteUrl}/api/og?title=AI+Tools+for+Small+Businesses`,
				width: 1200,
				height: 630,
				alt: `${config.appName} — AI Tools`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `AI Tools for Small Businesses — ${config.appName}`,
		description:
			"Explore our full suite of AI-powered business tools. Summarize meetings, process invoices, analyze contracts, separate speakers, and more.",
		images: [`${siteUrl}/api/og?title=AI+Tools+for+Small+Businesses`],
	},
};

const ENABLED_TOOLS = config.tools.registry.filter((t) => t.enabled);

const TOOL_ICONS: Record<string, React.ElementType> = {
	newspaper: NewspaperIcon,
	receipt: ReceiptIcon,
	"file-text": FileTextIcon,
	"clipboard-list": ClipboardListIcon,
	"message-square-text": SparklesIcon,
	wallet: WalletIcon,
	"separator-horizontal": SeparatorHorizontalIcon,
	"image-minus": ImageMinusIcon,
	"audio-lines": AudioLinesIcon,
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
	"news-analyzer":
		"Detect media bias and extract key themes from news articles. Ideal for research teams, marketers, and educators.",
	"invoice-processor":
		"Automatically extract vendor, amount, and line items from invoices in PDF or image format.",
	"contract-analyzer":
		"Surface key terms, risky clauses, and obligations from contracts without expensive legal review.",
	"meeting-summarizer":
		"Turn raw meeting notes or transcripts into structured summaries with action items and decisions.",
	"feedback-analyzer":
		"Classify sentiment, extract themes, and prioritize issues from customer or employee feedback.",
	"expense-categorizer":
		"Auto-categorize expenses from CSV or XLSX bank exports with budget summaries and overspend alerts.",
	"speaker-separation":
		"Identify and separate speakers in audio files with timestamped transcripts per speaker.",
	"diagram-editor":
		"Generate flowcharts, sequence diagrams, and more from plain-text descriptions.",
};

const TOOL_CATEGORIES: Record<string, string> = {
	"news-analyzer": "Analysis",
	"invoice-processor": "Finance",
	"contract-analyzer": "Legal",
	"meeting-summarizer": "Productivity",
	"feedback-analyzer": "Analysis",
	"expense-categorizer": "Finance",
	"speaker-separation": "Audio",
	"diagram-editor": "Productivity",
};

export default function ToolsMarketingPage() {
	const tools = ENABLED_TOOLS;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
			{/* Hero */}
			<section className="container mx-auto px-4 py-20 text-center">
				<span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
					AI-Powered Business Tools
				</span>
				<h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
					Every tool your team needs,{" "}
					<span className="text-primary">all in one place</span>
				</h1>
				<p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl">
					Automate the tedious parts of running a business. No
					expertise required — just upload your files and let AI do
					the work.
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<Button asChild size="lg">
						<Link href="/auth/signup">
							Get started free{" "}
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link href="/auth/login">Sign in</Link>
					</Button>
				</div>
			</section>

			{/* Tools grid */}
			<section className="container mx-auto px-4 pb-20">
				<div className="mb-10 text-center">
					<h2 className="mb-3 font-semibold text-2xl">
						{tools.length} tools available
					</h2>
					<p className="text-muted-foreground">
						Click any tool to learn more, or{" "}
						<Link
							href="/auth/signup"
							className="text-primary underline"
						>
							sign up
						</Link>{" "}
						to start using them today.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{tools.map((tool) => {
						const Icon = TOOL_ICONS[tool.icon] ?? SparklesIcon;
						const category = TOOL_CATEGORIES[tool.slug] ?? "Tools";
						const description =
							TOOL_DESCRIPTIONS[tool.slug] ?? tool.description;

						return (
							<Link
								key={tool.slug}
								href={`/tools/${tool.slug}`}
								className="group block rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
							>
								<div className="mb-4 flex items-start justify-between">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Icon className="h-6 w-6 text-primary" />
									</div>
									<div className="flex items-center gap-2">
										<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
											{category}
										</span>
										{tool.public ? null : (
											<span className="rounded border px-2 py-0.5 text-muted-foreground text-xs">
												Sign in
											</span>
										)}
									</div>
								</div>

								<h3 className="mb-2 font-semibold text-lg group-hover:text-primary">
									{tool.name}
								</h3>
								<p className="mb-4 text-muted-foreground text-sm leading-relaxed">
									{description}
								</p>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-xs">
										{tool.creditCost} credit
										{tool.creditCost !== 1 ? "s" : ""} per
										run
									</span>
									<span className="flex items-center gap-1 font-medium text-primary text-sm">
										Learn more{" "}
										<ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
									</span>
								</div>
							</Link>
						);
					})}
				</div>
			</section>

			{/* Bottom CTA */}
			<section className="border-t bg-muted/50 py-16">
				<div className="container mx-auto px-4 text-center">
					<h2 className="mb-4 font-bold text-3xl">
						Ready to automate your workflow?
					</h2>
					<p className="mb-8 text-muted-foreground text-lg">
						Start with a free account. No credit card required.
					</p>
					<Button asChild size="lg">
						<Link href="/auth/signup">
							Start for free{" "}
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>
		</div>
	);
}
