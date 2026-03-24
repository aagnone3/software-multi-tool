import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Security & Privacy — ${config.appName}`,
	description: `How ${config.appName} keeps your files, data, and business information secure. SOC 2 practices, encryption at rest and in transit, file deletion after processing.`,
	alternates: { canonical: `${siteUrl}/security` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/security`,
		title: `Security & Privacy — ${config.appName}`,
		description:
			"Enterprise-grade security practices to keep your business data safe.",
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent(`Security & Privacy — ${config.appName}`)}&description=${encodeURIComponent("Your data stays private. Files deleted after processing.")}`,
				width: 1200,
				height: 630,
				alt: `Security & Privacy — ${config.appName}`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Security & Privacy — ${config.appName}`,
		description:
			"Enterprise-grade security: encryption, file deletion after processing, no model training on your data.",
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
			name: "Security",
			item: `${siteUrl}/security`,
		},
	],
};

const securityPillars = [
	{
		icon: "🔐",
		title: "Encryption Everywhere",
		description:
			"All data is encrypted in transit using TLS 1.2+ and at rest using AES-256. Your files and results are never transmitted or stored unencrypted.",
	},
	{
		icon: "🗑️",
		title: "Files Deleted After Processing",
		description:
			"Uploaded files are processed to generate your results and immediately deleted. We do not retain your documents after your job completes.",
	},
	{
		icon: "🚫",
		title: "No Training on Your Data",
		description:
			"Your files and outputs are never used to train AI models — ours or any third party's. Your proprietary information stays yours.",
	},
	{
		icon: "🏢",
		title: "Tenant Isolation",
		description:
			"Every organization's data is logically isolated. Your files, jobs, and results are never accessible to other users or organizations.",
	},
	{
		icon: "🔑",
		title: "Secure Authentication",
		description:
			"Support for password auth, magic links, OAuth (Google, GitHub), two-factor authentication, and passkeys — with session management and automatic expiry.",
	},
	{
		icon: "📋",
		title: "Audit Logs",
		description:
			"Every significant action in your organization is logged. Admins can review audit logs at any time to track access, changes, and exports.",
	},
	{
		icon: "🌐",
		title: "Trusted Infrastructure",
		description:
			"Hosted on Vercel and Supabase — enterprise-grade cloud providers with SOC 2 Type II certifications, 99.9% uptime SLAs, and global CDN delivery.",
	},
	{
		icon: "🛡️",
		title: "Role-Based Access Control",
		description:
			"Organization admins control who can access which tools and data. Invite team members with defined roles — owner, admin, or member.",
	},
];

const faqs = [
	{
		q: "Who can see my uploaded files?",
		a: "Only you (and your organization members if you share access). Files are processed in isolated containers and deleted immediately after the job completes.",
	},
	{
		q: "Are my files used to train AI?",
		a: "No. Your files are never used to train or fine-tune any AI model. Your data is used only to generate your requested output.",
	},
	{
		q: "Where is my data stored?",
		a: "Data is stored in secure cloud infrastructure (Supabase / AWS), encrypted at rest and in transit. You can request deletion of your account and all associated data at any time.",
	},
	{
		q: "How long are files kept?",
		a: "Uploaded files are deleted after processing completes — typically within seconds to a few minutes. Output results are stored in your account for as long as your account is active.",
	},
	{
		q: "Do you have a data processing agreement (DPA)?",
		a: "Yes. Contact us to request a DPA for your organization if required for compliance purposes.",
	},
	{
		q: "What happens to my data if I close my account?",
		a: "All your data — files, job results, and personal information — is deleted within 30 days of account closure.",
	},
];

export default function SecurityPage() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>

			{/* Header */}
			<div className="mb-16 text-center">
				<div className="mb-4 text-5xl">🔒</div>
				<h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
					Security & Privacy
				</h1>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					Your business data is sensitive. We treat it that way.
					Here's exactly how {config.appName} protects your files,
					results, and organization data.
				</p>
			</div>

			{/* Security pillars */}
			<div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{securityPillars.map((pillar) => (
					<div
						key={pillar.title}
						className="rounded-xl border bg-card p-6 shadow-sm"
					>
						<div className="mb-3 text-3xl">{pillar.icon}</div>
						<h2 className="mb-2 font-semibold text-card-foreground text-lg">
							{pillar.title}
						</h2>
						<p className="text-muted-foreground text-sm">
							{pillar.description}
						</p>
					</div>
				))}
			</div>

			{/* Trust badge strip */}
			<div className="mb-20 rounded-2xl border bg-muted/30 px-8 py-10">
				<h2 className="mb-8 text-center font-bold text-2xl text-foreground">
					Built on enterprise-grade infrastructure
				</h2>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
					{[
						{
							label: "Vercel",
							detail: "Edge network & deployment",
						},
						{ label: "Supabase", detail: "SOC 2 Type II database" },
						{ label: "TLS 1.2+", detail: "Encrypted in transit" },
						{ label: "AES-256", detail: "Encrypted at rest" },
					].map((item) => (
						<div key={item.label} className="text-center">
							<div className="font-bold text-foreground text-xl">
								{item.label}
							</div>
							<div className="mt-1 text-muted-foreground text-sm">
								{item.detail}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* FAQ */}
			<div className="mb-16">
				<h2 className="mb-8 text-center font-bold text-2xl text-foreground">
					Security FAQ
				</h2>
				<div className="space-y-4">
					{faqs.map((faq) => (
						<div
							key={faq.q}
							className="rounded-xl border bg-card px-6 py-5 shadow-sm"
						>
							<h3 className="mb-2 font-semibold text-card-foreground">
								{faq.q}
							</h3>
							<p className="text-muted-foreground text-sm">
								{faq.a}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* CTA */}
			<div className="rounded-2xl bg-primary/5 px-8 py-10 text-center">
				<h2 className="mb-3 font-bold text-2xl text-foreground">
					Questions about security or compliance?
				</h2>
				<p className="mb-6 text-muted-foreground">
					We're happy to provide a data processing agreement, answer
					specific compliance questions, or discuss your
					organization's requirements.
				</p>
				<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
					<Link
						href="/contact"
						className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm hover:bg-primary/90"
					>
						Contact Us
					</Link>
					<Link
						href="/docs"
						className="inline-flex items-center justify-center rounded-lg border px-6 py-3 font-semibold text-sm hover:bg-muted"
					>
						Read the Docs
					</Link>
				</div>
			</div>
		</div>
	);
}
