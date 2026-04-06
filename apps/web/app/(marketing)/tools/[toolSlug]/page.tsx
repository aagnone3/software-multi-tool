import { StickyCta } from "@marketing/home/components/StickyCta";
import { ToolLandingCtaTracker } from "@marketing/tools/components/ToolLandingCtaTracker";
import { ToolLandingPageTracker } from "@marketing/tools/components/ToolLandingPageTracker";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	CheckCircleIcon,
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
import { notFound } from "next/navigation";
import React from "react";

interface ToolPageProps {
	params: Promise<{
		toolSlug: string;
	}>;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
	newspaper: NewspaperIcon,
	receipt: ReceiptIcon,
	"file-text": FileTextIcon,
	"clipboard-list": ClipboardListIcon,
	"message-square-text": SparklesIcon,
	wallet: WalletIcon,
	"separator-horizontal": SeparatorHorizontalIcon,
	"image-minus": ImageMinusIcon,
};

const TOOL_FEATURES: Record<string, string[]> = {
	"news-analyzer": [
		"Bias and sentiment detection across political spectrum",
		"Key theme extraction and summary",
		"Source credibility indicators",
		"Side-by-side article comparison",
	],
	"invoice-processor": [
		"Extract vendor, date, amount, and line items automatically",
		"Supports PDF, PNG, JPEG invoice formats",
		"Export clean data for accounting workflows",
		"Multi-currency and international invoice support",
	],
	"contract-analyzer": [
		"Surface key terms, obligations, and deadlines",
		"Identify risky or unusual clauses",
		"Plain-language summaries of legal language",
		"Supports PDF and DOCX contract files",
	],
	"meeting-summarizer": [
		"Structured summaries with action items",
		"Key decisions and follow-up tasks extracted",
		"Upload transcripts or paste meeting notes",
		"Speaker-attributed summaries with timestamps",
	],
	"feedback-analyzer": [
		"Sentiment classification (positive, negative, neutral)",
		"Theme and topic extraction from responses",
		"Priority issue identification",
		"Batch CSV processing for large datasets",
	],
	"expense-categorizer": [
		"Auto-categorize expenses from bank exports",
		"Supports CSV and XLSX statement files",
		"Custom category mapping and rules",
		"Budget summary and overspend detection",
	],
	"speaker-separation": [
		"Identify and separate individual speakers",
		"Timestamped transcripts per speaker",
		"Supports MP3, MP4, WAV audio files",
		"Works with meetings, interviews, and podcasts",
	],
	"diagram-editor": [
		"AI-assisted diagram generation from text",
		"Flowcharts, sequence diagrams, and more",
		"Export as SVG or PNG",
		"Mermaid syntax support",
	],
};

const TOOL_USE_CASES: Record<string, { title: string; description: string }[]> =
	{
		"news-analyzer": [
			{
				title: "Research teams",
				description:
					"Quickly scan dozens of articles for bias before sharing with leadership.",
			},
			{
				title: "Content marketers",
				description:
					"Understand how news sentiment affects your industry narrative.",
			},
			{
				title: "Educators",
				description:
					"Teach media literacy with AI-powered bias analysis.",
			},
		],
		"invoice-processor": [
			{
				title: "Accounts payable teams",
				description:
					"Process hundreds of invoices without manual data entry.",
			},
			{
				title: "Freelancers",
				description:
					"Extract invoice data directly into your accounting software.",
			},
			{
				title: "Operations managers",
				description:
					"Audit vendor invoices quickly and catch discrepancies early.",
			},
		],
		"contract-analyzer": [
			{
				title: "Small business owners",
				description:
					"Review vendor and client contracts without expensive legal review.",
			},
			{
				title: "Procurement teams",
				description:
					"Surface risky terms before signing supplier agreements.",
			},
			{
				title: "HR departments",
				description:
					"Quickly review employment contracts for key obligations.",
			},
		],
		"meeting-summarizer": [
			{
				title: "Project managers",
				description:
					"Turn raw meeting notes into actionable summaries instantly.",
			},
			{
				title: "Remote teams",
				description:
					"Keep distributed team members aligned without attending every call.",
			},
			{
				title: "Executives",
				description:
					"Get briefed on meetings you couldn't attend in under a minute.",
			},
		],
		"speaker-separation": [
			{
				title: "Journalists",
				description:
					"Separate interview speakers automatically for fast transcription.",
			},
			{
				title: "Podcast editors",
				description:
					"Split multi-speaker recordings by voice for easier post-production.",
			},
			{
				title: "Legal teams",
				description:
					"Attribute spoken words to specific participants in recorded hearings.",
			},
		],
		"feedback-analyzer": [
			{
				title: "Customer success teams",
				description:
					"Identify top pain points across hundreds of support tickets.",
			},
			{
				title: "Product managers",
				description:
					"Prioritize roadmap items from NPS survey verbatims.",
			},
			{
				title: "Researchers",
				description:
					"Code qualitative feedback at scale without manual labeling.",
			},
		],
		"expense-categorizer": [
			{
				title: "Small business owners",
				description:
					"Categorize a month of expenses in seconds instead of hours.",
			},
			{
				title: "Accountants",
				description:
					"Pre-process client bank exports before bringing into accounting software.",
			},
			{
				title: "Finance teams",
				description:
					"Detect spending anomalies across departments automatically.",
			},
		],
		"diagram-editor": [
			{
				title: "Software engineers",
				description:
					"Generate architecture diagrams from plain English descriptions.",
			},
			{
				title: "Business analysts",
				description:
					"Turn process descriptions into flowcharts instantly.",
			},
			{
				title: "Technical writers",
				description:
					"Create documentation diagrams without learning diagram tools.",
			},
		],
	};

export async function generateStaticParams() {
	return config.tools.registry
		.filter((tool) => tool.enabled)
		.map((tool) => ({ toolSlug: tool.slug }));
}

export async function generateMetadata({
	params,
}: ToolPageProps): Promise<Metadata> {
	const { toolSlug } = await params;
	const tool = config.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);

	if (!tool) {
		return { title: "Tool Not Found" };
	}

	const siteUrl = getBaseUrl();
	const title = `${tool.name} — AI-Powered | ${config.appName}`;
	const fallbackDescription = `${tool.description}. No technical knowledge required. Start free with ${tool.creditCost} credit${tool.creditCost === 1 ? "" : "s"} per use.`;
	const description = tool.seoDescription ?? fallbackDescription;

	return {
		title,
		description,
		alternates: { canonical: `${siteUrl}/tools/${toolSlug}` },
		openGraph: {
			type: "website",
			url: `${siteUrl}/tools/${toolSlug}`,
			title,
			description,
			images: [
				{
					url: `${siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [
				`${siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
			],
		},
	};
}

export default async function ToolMarketingPage({ params }: ToolPageProps) {
	const { toolSlug } = await params;
	const siteUrl = getBaseUrl();

	const tool = config.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);

	if (!tool) {
		notFound();
	}

	const Icon = TOOL_ICONS[tool.icon] ?? SparklesIcon;
	const features = TOOL_FEATURES[toolSlug] ?? [];
	const useCases = TOOL_USE_CASES[toolSlug] ?? [];

	const faqJsonLd =
		useCases.length > 0
			? {
					"@context": "https://schema.org",
					"@type": "FAQPage",
					mainEntity: useCases.map((uc) => ({
						"@type": "Question",
						name: `How does ${tool.name} help ${uc.title}?`,
						acceptedAnswer: {
							"@type": "Answer",
							text: uc.description,
						},
					})),
				}
			: null;

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
			{
				"@type": "ListItem",
				position: 2,
				name: "Tools",
				item: `${siteUrl}/tools`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: tool.name,
				item: `${siteUrl}/tools/${toolSlug}`,
			},
		],
	};

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: tool.name,
		description: tool.description,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		url: `${siteUrl}/tools/${toolSlug}`,
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			description: `10 free credits on signup. ${tool.creditCost} credit${tool.creditCost === 1 ? "" : "s"} per use.`,
		},
	};

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
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			{faqJsonLd && (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(faqJsonLd),
					}}
				/>
			)}
			<ToolLandingPageTracker toolSlug={toolSlug} toolName={tool.name} />
			<main>
				{/* Hero */}
				<section className="container pt-32 pb-16 text-center md:pt-40 lg:pb-24">
					<div className="mx-auto mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Icon className="size-8" />
					</div>
					<h1 className="mx-auto max-w-3xl text-balance font-bold text-4xl leading-tight md:text-5xl">
						{tool.name}
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-balance text-foreground/70 text-lg md:text-xl">
						{tool.description}
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button size="lg" variant="primary" asChild>
							<Link
								href={`/auth/signup?redirect=/app/tools/${toolSlug}`}
							>
								Try {tool.name}
								<ArrowRightIcon className="ml-2 size-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="/auth/signup">Sign Up Free</Link>
						</Button>
					</div>
					<p className="mt-4 text-foreground/50 text-sm">
						{tool.creditCost} credit
						{tool.creditCost === 1 ? "" : "s"} per use · No credit
						card required
					</p>
				</section>

				{/* Features */}
				{features.length > 0 && (
					<section className="border-t bg-muted/30 py-16">
						<div className="container">
							<h2 className="mb-10 text-center font-bold text-2xl md:text-3xl">
								What {tool.name} can do
							</h2>
							<ul className="mx-auto grid max-w-2xl gap-4">
								{features.map((feature) => (
									<li
										key={feature}
										className="flex items-start gap-3"
									>
										<CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-primary" />
										<span className="text-foreground/80">
											{feature}
										</span>
									</li>
								))}
							</ul>
						</div>
					</section>
				)}

				{/* Use cases */}
				{useCases.length > 0 && (
					<section className="py-16">
						<div className="container">
							<h2 className="mb-10 text-center font-bold text-2xl md:text-3xl">
								Who uses {tool.name}
							</h2>
							<div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
								{useCases.map((useCase) => (
									<div
										key={useCase.title}
										className="rounded-xl border bg-background p-6"
									>
										<h3 className="mb-2 font-semibold">
											{useCase.title}
										</h3>
										<p className="text-foreground/70 text-sm">
											{useCase.description}
										</p>
									</div>
								))}
							</div>
						</div>
					</section>
				)}

				{/* CTA */}
				<section className="border-t bg-primary/5 py-16 text-center">
					<div className="container">
						<h2 className="mb-4 font-bold text-2xl md:text-3xl">
							Ready to try {tool.name}?
						</h2>
						<p className="mb-8 text-foreground/70">
							Sign up free and get credits to start immediately.
							No credit card required.
						</p>
						<ToolLandingCtaTracker
							toolSlug={toolSlug}
							toolName={tool.name}
							source="tool_marketing_page_cta_section"
						/>
					</div>
				</section>
			</main>
			<StickyCta />
		</>
	);
}
