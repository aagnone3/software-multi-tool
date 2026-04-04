import { Button, Hr, Link, Section, Text } from "@react-email/components";
import React from "react";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

const FEATURED_TOOLS = [
	{
		emoji: "🎙️",
		name: "Meeting Summarizer",
		description: "Turn hour-long recordings into concise action items",
	},
	{
		emoji: "📄",
		name: "Contract Analyzer",
		description: "Spot risks and key clauses in any contract instantly",
	},
	{
		emoji: "🧾",
		name: "Invoice Processor",
		description: "Extract line items and totals from PDFs automatically",
	},
];

export function NewsletterSignup({
	appUrl = "https://softwaremultitool.com",
}: {
	appUrl?: string;
} & Omit<BaseMailProps, "locale" | "translations">) {
	const toolsUrl = `${appUrl}/tools`;
	const signupUrl = `${appUrl}/auth/signup`;

	return (
		<Wrapper>
			<Text className="text-xl font-bold text-foreground m-0 mb-2">
				You're in! 🎉
			</Text>

			<Text className="text-foreground/70 text-sm leading-relaxed mt-0">
				Thanks for subscribing. You'll get practical tips on using AI to
				automate the time-consuming parts of running a small business —
				no hype, just what works.
			</Text>

			<Hr className="border-border my-6" />

			<Text className="font-semibold text-sm text-foreground mb-3">
				While you're here — have you tried the tools yet?
			</Text>

			<Text className="text-foreground/70 text-sm leading-relaxed">
				Every new account gets <strong>10 free credits</strong> to try
				any tool. No credit card required.
			</Text>

			{FEATURED_TOOLS.map((tool) => (
				<Section key={tool.name} className="mb-4">
					<Text className="m-0 text-sm font-semibold text-foreground">
						{tool.emoji} {tool.name}
					</Text>
					<Text className="m-0 text-foreground/60 text-sm">
						{tool.description}
					</Text>
				</Section>
			))}

			<Section className="my-6">
				<Button
					href={signupUrl}
					className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white text-sm no-underline"
				>
					Try free — 10 credits, no card →
				</Button>
			</Section>

			<Text className="text-foreground/50 text-xs">
				Already have an account?{" "}
				<Link href={toolsUrl} className="text-primary">
					Go to your tools
				</Link>
			</Text>

			<Hr className="border-border my-6" />

			<Text className="text-foreground/40 text-xs">
				You subscribed at{" "}
				<Link href={appUrl} className="text-primary">
					{appUrl}
				</Link>
				. You can unsubscribe at any time by replying to this email.
			</Text>
		</Wrapper>
	);
}

NewsletterSignup.PreviewProps = {
	appUrl: "https://softwaremultitool.com",
	locale: defaultLocale,
	translations: defaultTranslations,
};

export default NewsletterSignup;
