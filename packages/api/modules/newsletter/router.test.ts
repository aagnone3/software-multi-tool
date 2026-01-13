import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mailFixture,
	mockMailModule,
	resetExternalServicesMocks,
} from "../../../../tests/fixtures/external-services";
import { newsletterRouter } from "./router";

vi.mock("@repo/mail", () => mockMailModule());

describe("Newsletter Router", () => {
	beforeEach(() => {
		resetExternalServicesMocks();
	});

	describe("newsletter.subscribe", () => {
		const createClient = () =>
			createProcedureClient(newsletterRouter.subscribe, {
				context: {
					headers: new Headers({
						"accept-language": "en",
					}),
				},
			});

		it("sends confirmation email with valid email address", async () => {
			const client = createClient();

			const input = {
				email: "subscriber@example.com",
			};

			await client(input);

			expect(mailFixture.sendEmail).toHaveBeenCalledOnce();
			expect(mailFixture.sendEmail).toHaveBeenCalledWith({
				to: input.email,
				locale: "en",
				templateId: "newsletterSignup",
				context: {},
			});
		});

		it("always uses English locale (i18n removed)", async () => {
			const client = createProcedureClient(newsletterRouter.subscribe, {
				context: {
					headers: new Headers({
						cookie: "NEXT_LOCALE=fr",
					}),
				},
			});

			await client({
				email: "subscriber@example.com",
			});

			// i18n removed - always uses "en" regardless of cookie
			expect(mailFixture.sendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					locale: "en",
				}),
			);
		});

		it("defaults to en locale when accept-language header is missing", async () => {
			const client = createProcedureClient(newsletterRouter.subscribe, {
				context: {
					headers: new Headers(),
				},
			});

			await client({
				email: "subscriber@example.com",
			});

			expect(mailFixture.sendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					locale: "en",
				}),
			);
		});

		it("throws INTERNAL_SERVER_ERROR when email sending fails", async () => {
			mailFixture.sendEmail.mockRejectedValueOnce(
				new Error("Email service unavailable"),
			);

			const client = createClient();

			await expect(
				client({
					email: "subscriber@example.com",
				}),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});

		it("rejects invalid email format", async () => {
			const client = createClient();

			await expect(
				client({
					email: "not-an-email",
				}),
			).rejects.toThrow();
		});

		it("rejects missing email field", async () => {
			const client = createClient();

			await expect(
				// @ts-expect-error - testing runtime validation
				client({}),
			).rejects.toThrow();
		});

		it("accepts various valid email formats", async () => {
			const client = createClient();

			const validEmails = [
				"simple@example.com",
				"very.common@example.com",
				"disposable.style.email.with+symbol@example.com",
				"user@subdomain.example.com",
			];

			for (const email of validEmails) {
				mailFixture.sendEmail.mockClear();
				await client({ email });
				expect(mailFixture.sendEmail).toHaveBeenCalledWith(
					expect.objectContaining({
						to: email,
					}),
				);
			}
		});
	});
});
