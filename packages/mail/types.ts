export interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export type SendEmailHandler = (params: SendEmailParams) => Promise<void>;

export interface MailProvider {
	send: SendEmailHandler;
}

/** Locale type (English only after i18n removal) */
export type Locale = "en";

export type BaseMailProps = {
	locale: Locale;
	// Using any for translations to work with use-intl createTranslator
	translations: any;
};
