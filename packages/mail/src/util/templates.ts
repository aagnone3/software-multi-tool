import { render } from "@react-email/render";
import { mailTemplates } from "../../emails";
import type { Locale } from "../../types";
import { defaultTranslations } from "./translations";

export async function getTemplate<T extends TemplateId>({
	templateId,
	context,
	locale,
}: {
	templateId: T;
	context: Omit<
		Parameters<(typeof mailTemplates)[T]>[0],
		"locale" | "translations"
	>;
	locale: Locale;
}) {
	const template = mailTemplates[templateId];
	// Always use English translations (i18n removed)
	const translations = defaultTranslations;

	const email = template({
		...(context as any),
		locale,
		translations,
	});

	const mailSection = translations.mail as Record<
		string,
		{ subject?: string }
	>;
	const subject =
		templateId in mailSection && "subject" in mailSection[templateId]
			? (mailSection[templateId].subject ?? "")
			: "";

	const html = await render(email);
	const text = await render(email, { plainText: true });
	return { html, text, subject };
}

export type TemplateId = keyof typeof mailTemplates;
