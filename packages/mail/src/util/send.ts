import { logger } from "@repo/logs";
import type { mailTemplates } from "../../emails";
import type { Locale } from "../../types";
import { send } from "../provider";
import type { TemplateId } from "./templates";
import { getTemplate } from "./templates";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE: Locale = "en";

export async function sendEmail<T extends TemplateId>(
	params: {
		to: string;
		locale?: Locale;
	} & (
		| {
				templateId: T;
				context: Omit<
					Parameters<(typeof mailTemplates)[T]>[0],
					"locale" | "translations"
				>;
		  }
		| {
				subject: string;
				text?: string;
				html?: string;
		  }
	),
) {
	const { to, locale = DEFAULT_LOCALE } = params;

	let html: string;
	let text: string;
	let subject: string;

	if ("templateId" in params) {
		const { templateId, context } = params;
		const template = await getTemplate({
			templateId,
			context,
			locale,
		});
		subject = template.subject;
		text = template.text;
		html = template.html;
	} else {
		subject = params.subject;
		text = params.text ?? "";
		html = params.html ?? "";
	}

	try {
		await send({
			to,
			subject,
			text,
			html,
		});
		return true;
	} catch (e) {
		logger.error(e);
		return false;
	}
}
