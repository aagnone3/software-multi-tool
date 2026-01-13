import { createProcedureClient } from "@orpc/server";
import { config } from "@repo/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mailFixture,
	mockMailModule,
	resetExternalServicesMocks,
} from "../../../../tests/fixtures/external-services";
import { contactRouter } from "./router";

vi.mock("@repo/mail", () => mockMailModule());

describe("Contact Router", () => {
	beforeEach(() => {
		resetExternalServicesMocks();
	});

	describe("contact.submit", () => {
		const createClient = () =>
			createProcedureClient(contactRouter.submit, {
				context: {
					headers: new Headers({
						"accept-language": "en",
					}),
				},
			});

		it("sends email with valid contact form data", async () => {
			const client = createClient();

			const input = {
				email: "test@example.com",
				name: "John Doe",
				message: "This is a test message with at least 10 characters",
			};

			await client(input);

			expect(mailFixture.sendEmail).toHaveBeenCalledOnce();
			expect(mailFixture.sendEmail).toHaveBeenCalledWith({
				to: config.contactForm.to,
				locale: "en",
				subject: config.contactForm.subject,
				text: `Name: ${input.name}\n\nEmail: ${input.email}\n\nMessage: ${input.message}`,
			});
		});

		it("always uses English locale (i18n removed)", async () => {
			const client = createProcedureClient(contactRouter.submit, {
				context: {
					headers: new Headers({
						cookie: "NEXT_LOCALE=es",
					}),
				},
			});

			await client({
				email: "test@example.com",
				name: "Jane Doe",
				message: "Message in Spanish context",
			});

			// i18n removed - always uses "en" regardless of cookie
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
					email: "test@example.com",
					name: "John Doe",
					message: "This should fail",
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
					name: "John Doe",
					message: "Valid message here",
				}),
			).rejects.toThrow();
		});

		it("rejects name shorter than 3 characters", async () => {
			const client = createClient();

			await expect(
				client({
					email: "test@example.com",
					name: "Jo",
					message: "Valid message here",
				}),
			).rejects.toThrow();
		});

		it("rejects message shorter than 10 characters", async () => {
			const client = createClient();

			await expect(
				client({
					email: "test@example.com",
					name: "John Doe",
					message: "Short",
				}),
			).rejects.toThrow();
		});

		it("rejects missing required fields", async () => {
			const client = createClient();

			await expect(
				// @ts-expect-error - testing runtime validation
				client({
					email: "test@example.com",
					name: "John Doe",
					// message is missing
				}),
			).rejects.toThrow();
		});
	});
});
