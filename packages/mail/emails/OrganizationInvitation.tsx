import { Button, Hr, Link, Section, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

const FEATURED_TOOLS = [
	{
		emoji: "🎙️",
		name: "Meeting Summarizer",
		description: "Turn recordings into concise summaries and action items",
	},
	{
		emoji: "📄",
		name: "Contract Analyzer",
		description: "Spot risks and key clauses in any contract instantly",
	},
	{
		emoji: "🧾",
		name: "Invoice Processor",
		description: "Extract data from invoices automatically",
	},
];

export function OrganizationInvitation({
	url,
	organizationName,
	appUrl = "https://softwaremultitool.com",
	locale,
	translations,
}: {
	url: string;
	organizationName: string;
	appUrl?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Text className="text-xl font-bold text-foreground m-0 mb-2">
				{t.markup("mail.organizationInvitation.headline", {
					organizationName,
					strong: (chunks) => `<strong>${chunks}</strong>`,
				})}
			</Text>

			<Text className="text-foreground/70 text-sm leading-relaxed mt-0">
				{t("mail.organizationInvitation.body", { organizationName })}
			</Text>

			<Section className="my-6">
				<Button
					href={url}
					className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white text-sm no-underline"
				>
					{t("mail.organizationInvitation.join")} →
				</Button>
			</Section>

			<Hr className="border-border my-6" />

			<Text className="font-semibold text-sm text-foreground mb-1">
				What is Software Multitool?
			</Text>
			<Text className="text-foreground/70 text-sm leading-relaxed mt-0 mb-4">
				It's a suite of AI-powered business tools that automate the
				time-consuming parts of your workflow — no prompts to engineer,
				no APIs to set up.
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

			<Hr className="border-border my-6" />

			<Text className="text-foreground/70 text-sm leading-relaxed">
				Your team is already using these tools. Join them and start
				saving time today.
			</Text>

			<Text className="mt-4 text-muted-foreground text-sm">
				{t("mail.common.openLinkInBrowser")}
				<Link href={url}>{url}</Link>
			</Text>

			<Text className="text-foreground/40 text-xs mt-6">
				Not sure what this is?{" "}
				<Link href={appUrl} className="text-primary">
					Learn more at softwaremultitool.com
				</Link>
			</Text>
		</Wrapper>
	);
}

OrganizationInvitation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	organizationName: "Software Multitool",
	appUrl: "https://softwaremultitool.com",
};

export default OrganizationInvitation;
