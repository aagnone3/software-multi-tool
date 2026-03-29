import { Button, Hr, Link, Section, Text } from "@react-email/components";
import React from "react";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

const tools = [
	{
		emoji: "🎙️",
		name: "Meeting Summarizer",
		description: "Turn recordings into action items in minutes",
	},
	{
		emoji: "📄",
		name: "Contract Analyzer",
		description: "Spot risks and key clauses instantly",
	},
	{
		emoji: "🧾",
		name: "Invoice Processor",
		description: "Extract data from invoices automatically",
	},
	{
		emoji: "💬",
		name: "Speaker Separation",
		description: "Identify who said what in any recording",
	},
];

export function WelcomeEmail({
	name,
	appUrl,
}: {
	name: string;
	appUrl: string;
} & Omit<BaseMailProps, "locale" | "translations">) {
	const firstName = name?.split(" ")[0] ?? "there";
	const dashboardUrl = `${appUrl}/app`;
	const toolsUrl = `${appUrl}/app/tools`;

	return (
		<Wrapper>
			<Text className="text-xl font-bold text-foreground m-0 mb-2">
				Welcome, {firstName}! Your 10 free credits are ready 🎉
			</Text>

			<Text className="text-foreground/70 text-sm leading-relaxed mt-0">
				You're all set. Here's how to make the most of your free
				credits:
			</Text>

			<Section className="my-6">
				<Button
					href={toolsUrl}
					className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white text-sm no-underline"
				>
					Browse all 8 tools →
				</Button>
			</Section>

			<Hr className="border-border my-6" />

			<Text className="font-semibold text-sm text-foreground mb-3">
				Most popular tools to try first:
			</Text>

			{tools.map((tool) => (
				<Section key={tool.name} className="mb-4">
					<Text className="m-0 text-sm font-semibold text-foreground">
						{tool.emoji} {tool.name}
					</Text>
					<Text className="m-0 text-foreground/60 text-sm">
						{tool.description}
					</Text>
				</Section>
			))}

			<Hr className="border-border my-6" />

			<Text className="text-foreground/70 text-sm leading-relaxed">
				Each tool costs 1–3 credits. Your 10 free credits let you try
				several tools before committing to a plan.
			</Text>

			<Section className="mt-6">
				<Button
					href={dashboardUrl}
					className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white text-sm no-underline"
				>
					Go to your dashboard →
				</Button>
			</Section>

			<Text className="text-foreground/50 text-xs mt-6">
				Questions? Reply to this email — we read every message.
			</Text>

			<Text className="text-foreground/40 text-xs">
				You received this because you signed up at{" "}
				<Link href={appUrl} className="text-primary">
					{appUrl}
				</Link>
				.
			</Text>
		</Wrapper>
	);
}

WelcomeEmail.PreviewProps = {
	name: "Jane Doe",
	appUrl: "https://softwaremultitool.com",
	locale: defaultLocale,
	translations: defaultTranslations,
};

export default WelcomeEmail;
