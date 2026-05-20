import {
	submitHubSpotForm,
	verifyTurnstile,
} from "@aagnone3/hubspot-forms/server";
import { ORPCError } from "@orpc/client";
import { config } from "@repo/config";
import { logger } from "@repo/logs";
import { type Locale, sendEmail } from "@repo/mail";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { publicProcedure } from "../../../orpc/procedures";
import { contactFormSchema } from "../types";

function splitName(name: string): { firstName: string; lastName?: string } {
	const trimmed = name.trim();
	const firstSpace = trimmed.indexOf(" ");
	if (firstSpace === -1) {
		return { firstName: trimmed };
	}
	return {
		firstName: trimmed.slice(0, firstSpace),
		lastName: trimmed.slice(firstSpace + 1).trim() || undefined,
	};
}

async function sendFallbackEmail(input: {
	name: string;
	email: string;
	message: string;
	locale: Locale;
}): Promise<boolean> {
	return await sendEmail({
		to: config.contactForm.to,
		locale: input.locale,
		subject: config.contactForm.subject,
		text: `Name: ${input.name}\n\nEmail: ${input.email}\n\nMessage: ${input.message}`,
	});
}

export const submitContactForm = publicProcedure
	.route({
		method: "POST",
		path: "/contact",
		tags: ["Contact"],
		summary: "Submit contact form",
	})
	.input(contactFormSchema)
	.use(localeMiddleware)
	.handler(async ({ input, context: { locale, headers } }) => {
		const {
			email,
			name,
			message,
			turnstileToken,
			hutk,
			pageUri,
			pageName,
			website,
		} = input;

		// Honeypot — pretend success without doing any work.
		if (website?.trim()) {
			return;
		}

		const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
		if (turnstileSecret) {
			const remoteIp =
				headers?.get("cf-connecting-ip") ??
				headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
				null;
			const verdict = await verifyTurnstile(
				turnstileToken,
				turnstileSecret,
				remoteIp,
			);
			if (!verdict.ok) {
				logger.error({ reason: verdict.reason }, "turnstile_failed");
				throw new ORPCError("BAD_REQUEST", {
					message: "Captcha verification failed.",
				});
			}
		}

		const portalId = process.env.HUBSPOT_PORTAL_ID;
		const formGuid = process.env.HUBSPOT_FORM_GUID;

		const { firstName, lastName } = splitName(name);

		const fields: Array<{ name: string; value: string }> = [
			{ name: "firstname", value: firstName },
			{ name: "email", value: email },
			{ name: "message", value: message },
		];
		if (lastName) {
			fields.splice(1, 0, { name: "lastname", value: lastName });
		}

		let hubspotSucceeded = false;
		if (portalId && formGuid) {
			try {
				const result = await submitHubSpotForm({
					portalId,
					formGuid,
					fields,
					context: { hutk, pageUri, pageName },
				});
				hubspotSucceeded = result.ok;
				if (!result.ok) {
					logger.error(
						{
							status: result.status,
							errorType: result.errorType,
							message: result.message,
							correlationId: result.correlationId,
							errors: result.errors,
							rawBody: result.rawBody,
						},
						"hubspot_submission_failed",
					);
				}
			} catch (error) {
				logger.error(error, "hubspot_submission_threw");
			}
		} else {
			logger.error("hubspot_env_missing");
		}

		if (hubspotSucceeded) {
			return;
		}

		let emailSent = false;
		try {
			emailSent = await sendFallbackEmail({
				name,
				email,
				message,
				locale,
			});
		} catch (error) {
			logger.error(error, "contact_fallback_email_failed");
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		if (!emailSent) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}
	});
