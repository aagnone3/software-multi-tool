import { Heading, Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../src/components/PrimaryButton";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

export function NotificationEmail({
	title,
	body,
	actionUrl,
	actionLabel,
	locale,
	translations,
}: {
	title: string;
	body: string;
	actionUrl?: string;
	actionLabel?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Heading className="text-xl">{title}</Heading>
			<Text style={{ whiteSpace: "pre-wrap" }}>{body}</Text>

			{actionUrl && actionLabel && (
				<>
					<PrimaryButton href={actionUrl}>
						{actionLabel}
					</PrimaryButton>

					<Text className="mt-4 text-muted-foreground text-sm">
						{t("mail.common.openLinkInBrowser")}
						<Link href={actionUrl}>{actionUrl}</Link>
					</Text>
				</>
			)}
		</Wrapper>
	);
}

NotificationEmail.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	title: "Your subscription has been activated",
	body: "Your Pro subscription is now active. You can now access all premium features.",
	actionUrl: "https://example.com/settings/billing",
	actionLabel: "View Billing",
};

export default NotificationEmail;
