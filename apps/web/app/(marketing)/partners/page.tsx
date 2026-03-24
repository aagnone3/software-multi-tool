import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import {
	ArrowRightIcon,
	CheckCircleIcon,
	DollarSignIcon,
	GlobeIcon,
	HandshakeIcon,
	LayoutDashboardIcon,
	LineChartIcon,
	MegaphoneIcon,
	StarIcon,
	UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
	title: `Partner Program — ${config.appName}`,
	description: `Join the ${config.appName} partner program. Earn recurring commissions by referring small businesses to our AI-powered productivity tools. Affiliates earn 30% recurring revenue.`,
	alternates: { canonical: `${siteUrl}/partners` },
	openGraph: {
		type: "website",
		url: `${siteUrl}/partners`,
		title: `Partner Program — ${config.appName}`,
		description: `Earn 30% recurring commissions by referring small businesses to ${config.appName}. Join our affiliate and reseller program.`,
		images: [
			{
				url: `${siteUrl}/api/og?title=${encodeURIComponent("Partner Program")}&description=${encodeURIComponent("Earn 30% recurring commissions")}`,
				width: 1200,
				height: 630,
				alt: `${config.appName} Partner Program`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Partner Program — ${config.appName}`,
		description: `Earn 30% recurring commissions by referring small businesses to ${config.appName}.`,
	},
};

const partnerTiers = [
	{
		name: "Affiliate",
		icon: MegaphoneIcon,
		commission: "30%",
		period: "recurring",
		color: "blue",
		description: "Share your unique link, earn recurring revenue.",
		requirements: "No minimum — anyone can join",
		benefits: [
			"30% recurring commission for 12 months",
			"90-day cookie window",
			"Real-time dashboard with clicks, conversions, and earnings",
			"Dedicated affiliate resources and banners",
			"Monthly payouts via Stripe",
		],
		cta: "Join as Affiliate",
		ctaHref: "/auth/sign-up?ref=affiliate",
		featured: false,
	},
	{
		name: "Reseller",
		icon: UsersIcon,
		commission: "40%",
		period: "recurring",
		color: "purple",
		description: "Offer white-label or co-branded plans to your clients.",
		requirements: "5+ active referrals/month",
		benefits: [
			"40% recurring commission for the lifetime of the account",
			"Co-branded landing pages",
			"Priority support SLA",
			"Dedicated account manager",
			"Volume discounts for your clients",
			"Quarterly business reviews",
		],
		cta: "Apply as Reseller",
		ctaHref: "/contact?subject=reseller",
		featured: true,
	},
	{
		name: "Agency / Integrator",
		icon: LayoutDashboardIcon,
		commission: "Custom",
		period: "white-label",
		color: "amber",
		description: "Embed our tools in your product or service.",
		requirements: "Established client base",
		benefits: [
			"Custom revenue share (typically 40–50%)",
			"Full white-label option under your brand",
			"API access for deep integrations",
			"Custom onboarding for your clients",
			"Co-marketing opportunities",
			"Dedicated integration engineer",
		],
		cta: "Talk to Sales",
		ctaHref: "/contact?subject=agency",
		featured: false,
	},
];

const stats = [
	{ label: "Avg. commission per referral / month", value: "$47" },
	{ label: "Average customer LTV", value: "14 months" },
	{ label: "Conversion rate (trial → paid)", value: "38%" },
	{ label: "Affiliates currently earning", value: "400+" },
];

const faq = [
	{
		q: "When do I get paid?",
		a: "We pay out on the 1st of each month for the prior month's earnings. Minimum payout is $25 via Stripe.",
	},
	{
		q: "How long does the cookie last?",
		a: "90 days. If someone clicks your link and converts within 90 days, you get credit.",
	},
	{
		q: "Is there a cap on earnings?",
		a: "No cap. Some of our top affiliates earn $3,000+ per month from recurring commissions.",
	},
	{
		q: "Can I promote on social media?",
		a: "Yes — social, email, YouTube, newsletters, blogs, podcasts, paid ads — all allowed. Just no incentivized traffic or misleading claims.",
	},
	{
		q: "What if a customer upgrades their plan?",
		a: "You earn commission on the higher plan rate automatically. Your commission scales with the customer.",
	},
	{
		q: "Do commissions apply to annual plans?",
		a: "Yes. Annual plan commissions are paid upfront as a lump sum equal to 30% of the annual subscription value.",
	},
];

export default function PartnersPage() {
	const colorMap = {
		blue: {
			bg: "bg-blue-50",
			border: "border-blue-200",
			icon: "text-blue-600",
			badge: "bg-blue-100 text-blue-700",
		},
		purple: {
			bg: "bg-purple-50",
			border: "border-purple-200",
			icon: "text-purple-600",
			badge: "bg-purple-100 text-purple-700",
		},
		amber: {
			bg: "bg-amber-50",
			border: "border-amber-200",
			icon: "text-amber-600",
			badge: "bg-amber-100 text-amber-700",
		},
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Hero */}
			<section className="bg-gradient-to-br from-slate-900 to-slate-700 px-4 py-20 text-white">
				<div className="mx-auto max-w-4xl text-center">
					<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
						<HandshakeIcon className="h-4 w-4" />
						Partner Program
					</div>
					<h1 className="mb-6 text-4xl font-bold md:text-5xl">
						Earn recurring commissions.
						<br />
						<span className="text-blue-400">
							Help small businesses thrive.
						</span>
					</h1>
					<p className="mx-auto mb-8 max-w-2xl text-xl text-slate-300">
						Join 400+ partners earning 30–40% recurring commissions
						by introducing their audience to {config.appName}. No
						monthly quota. Monthly payouts.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							href="/auth/sign-up?ref=affiliate"
							className="flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-400"
						>
							Get your affiliate link{" "}
							<ArrowRightIcon className="h-5 w-5" />
						</Link>
						<Link
							href="/contact?subject=reseller"
							className="rounded-lg border border-white/30 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
						>
							Become a Reseller
						</Link>
					</div>
				</div>
			</section>

			{/* Stats */}
			<section className="border-b bg-slate-50 px-4 py-12">
				<div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="text-3xl font-bold text-slate-900">
								{stat.value}
							</div>
							<div className="mt-1 text-sm text-slate-500">
								{stat.label}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Tiers */}
			<section className="px-4 py-20">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-slate-900">
							Choose your partnership level
						</h2>
						<p className="mt-4 text-lg text-slate-600">
							From solo affiliates to agency integrations — find
							the right fit.
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-3">
						{partnerTiers.map((tier) => {
							const colors =
								colorMap[tier.color as keyof typeof colorMap];
							const Icon = tier.icon;
							return (
								<div
									key={tier.name}
									className={`relative rounded-2xl border-2 p-8 ${tier.featured ? "border-purple-400 shadow-xl" : "border-slate-200"}`}
								>
									{tier.featured && (
										<div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
											Most Popular
										</div>
									)}
									<div
										className={`mb-4 inline-flex rounded-lg p-2 ${colors.bg}`}
									>
										<Icon
											className={`h-6 w-6 ${colors.icon}`}
										/>
									</div>
									<h3 className="text-xl font-bold text-slate-900">
										{tier.name}
									</h3>
									<p className="mt-2 text-sm text-slate-600">
										{tier.description}
									</p>
									<div className="mt-4">
										<span className="text-4xl font-bold text-slate-900">
											{tier.commission}
										</span>
										<span className="ml-1 text-slate-500">
											{tier.period}
										</span>
									</div>
									<div
										className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${colors.badge}`}
									>
										{tier.requirements}
									</div>
									<ul className="mt-6 space-y-3">
										{tier.benefits.map((b) => (
											<li
												key={b}
												className="flex items-start gap-2 text-sm"
											>
												<CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
												<span className="text-slate-700">
													{b}
												</span>
											</li>
										))}
									</ul>
									<Link
										href={tier.ctaHref}
										className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition ${
											tier.featured
												? "bg-purple-600 text-white hover:bg-purple-700"
												: "border border-slate-200 text-slate-700 hover:bg-slate-50"
										}`}
									>
										{tier.cta}
									</Link>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="bg-slate-50 px-4 py-20">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
						How it works
					</h2>
					<div className="grid gap-8 md:grid-cols-3">
						{[
							{
								step: "1",
								icon: HandshakeIcon,
								title: "Sign up & get your link",
								desc: "Create a free account, join the affiliate program, and get your unique tracking link within minutes.",
							},
							{
								step: "2",
								icon: MegaphoneIcon,
								title: "Share with your audience",
								desc: "Post on social, write a blog, send an email newsletter, or add a banner to your website. We provide ready-made assets.",
							},
							{
								step: "3",
								icon: DollarSignIcon,
								title: "Earn recurring commissions",
								desc: "Every time someone signs up for a paid plan through your link, you earn 30% — month after month for up to 12 months.",
							},
						].map((item) => {
							const Icon = item.icon;
							return (
								<div key={item.step} className="text-center">
									<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
										{item.step}
									</div>
									<Icon className="mx-auto mb-3 h-8 w-8 text-blue-600" />
									<h3 className="text-lg font-semibold text-slate-900">
										{item.title}
									</h3>
									<p className="mt-2 text-sm text-slate-600">
										{item.desc}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Ideal partners */}
			<section className="px-4 py-20">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
						Who partners with us?
					</h2>
					<p className="mb-12 text-center text-lg text-slate-600">
						Our partners reach small businesses, freelancers, and
						professional teams — our ideal customers.
					</p>
					<div className="grid gap-4 md:grid-cols-2">
						{[
							{
								icon: GlobeIcon,
								title: "Business bloggers & YouTubers",
								desc: "Productivity, small business, and entrepreneurship content creators who review tools and recommend software.",
							},
							{
								icon: UsersIcon,
								title: "Accountants & bookkeepers",
								desc: "CPAs and bookkeepers who help small business clients with financial workflows — perfect use case for our invoice and expense tools.",
							},
							{
								icon: LineChartIcon,
								title: "Business consultants & coaches",
								desc: "Management consultants and business coaches who advise small teams on operations and efficiency.",
							},
							{
								icon: StarIcon,
								title: "Podcast hosts & newsletter writers",
								desc: "Hosts and writers covering productivity, remote work, entrepreneurship, or small business topics.",
							},
						].map((item) => {
							const Icon = item.icon;
							return (
								<div
									key={item.title}
									className="flex gap-4 rounded-xl border border-slate-200 p-5"
								>
									<Icon className="mt-1 h-6 w-6 shrink-0 text-blue-600" />
									<div>
										<h3 className="font-semibold text-slate-900">
											{item.title}
										</h3>
										<p className="mt-1 text-sm text-slate-600">
											{item.desc}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="bg-slate-50 px-4 py-20">
				<div className="mx-auto max-w-3xl">
					<h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
						Frequently asked questions
					</h2>
					<div className="space-y-6">
						{faq.map((item) => (
							<div
								key={item.q}
								className="rounded-xl border border-slate-200 bg-white p-6"
							>
								<h3 className="font-semibold text-slate-900">
									{item.q}
								</h3>
								<p className="mt-2 text-slate-600">{item.a}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="bg-blue-600 px-4 py-20 text-white">
				<div className="mx-auto max-w-3xl text-center">
					<HandshakeIcon className="mx-auto mb-4 h-12 w-12 text-blue-200" />
					<h2 className="text-3xl font-bold">
						Ready to start earning?
					</h2>
					<p className="mt-4 text-xl text-blue-100">
						Join 400+ partners and start earning 30% recurring
						commissions. Takes less than 5 minutes to get your first
						affiliate link.
					</p>
					<Link
						href="/auth/sign-up?ref=affiliate"
						className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition hover:bg-blue-50"
					>
						Get started free <ArrowRightIcon className="h-5 w-5" />
					</Link>
					<p className="mt-4 text-sm text-blue-200">
						No credit card required. Free to join.
					</p>
				</div>
			</section>
		</div>
	);
}
