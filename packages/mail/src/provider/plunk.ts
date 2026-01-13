import { config } from "@repo/config";
import { logger } from "@repo/logs";
import type { SendEmailHandler } from "../../types";

const { from } = config.mails;

export const send: SendEmailHandler = async ({ to, subject, html, text }) => {
	const response = await fetch("https://next-api.useplunk.com/v1/send", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
		},
		body: JSON.stringify({
			from,
			to,
			subject,
			body: html,
			text,
		}),
	});

	if (!response.ok) {
		logger.error(await response.json());

		throw new Error("Could not send email");
	}
};
