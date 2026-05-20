import { createProcedureClient } from "@orpc/server";
import { config } from "@repo/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	mailFixture,
	mockMailModule,
	resetExternalServicesMocks,
} from "../../../../tests/fixtures/external-services";
import { contactRouter } from "./router";

const { mockLoggerError, mockLoggerLog } = vi.hoisted(() => ({
	mockLoggerError: vi.fn(),
	mockLoggerLog: vi.fn(),
}));

const { mockSubmitHubSpotForm, mockVerifyTurnstile } = vi.hoisted(() => ({
	mockSubmitHubSpotForm: vi.fn(),
	mockVerifyTurnstile: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: {
		error: mockLoggerError,
		log: mockLoggerLog,
	},
}));

vi.mock("@repo/mail", () => mockMailModule());

vi.mock("@aagnone3/hubspot-forms/server", () => ({
	submitHubSpotForm: mockSubmitHubSpotForm,
	verifyTurnstile: mockVerifyTurnstile,
}));

const originalEnv = { ...process.env };

describe("Contact Router", () => {
	beforeEach(() => {
		resetExternalServicesMocks();
		mockSubmitHubSpotForm.mockReset();
		mockSubmitHubSpotForm.mockResolvedValue({ ok: true, status: 200 });
		mockVerifyTurnstile.mockReset();
		mockVerifyTurnstile.mockResolvedValue({ ok: true });
		mockLoggerError.mockReset();
		process.env.HUBSPOT_PORTAL_ID = "test-portal";
		process.env.HUBSPOT_FORM_GUID = "test-form-guid";
		process.env.TURNSTILE_SECRET_KEY = "";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe("contact.submit", () => {
		const createClient = (headers?: Headers) =>
			createProcedureClient(contactRouter.submit, {
				context: {
					headers:
						headers ??
						new Headers({
							"accept-language": "en",
						}),
				},
			});

		it("submits to HubSpot without sending email on success", async () => {
			const client = createClient();

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "This is a test message with at least 10 characters",
			});

			expect(mockSubmitHubSpotForm).toHaveBeenCalledOnce();
			expect(mockSubmitHubSpotForm).toHaveBeenCalledWith(
				expect.objectContaining({
					portalId: "test-portal",
					formGuid: "test-form-guid",
					fields: expect.arrayContaining([
						{ name: "firstname", value: "John" },
						{ name: "lastname", value: "Doe" },
						{ name: "email", value: "test@example.com" },
						{
							name: "message",
							value: "This is a test message with at least 10 characters",
						},
					]),
				}),
			);
			expect(mailFixture.sendEmail).not.toHaveBeenCalled();
		});

		it("omits lastname when only a single name is given", async () => {
			const client = createClient();

			await client({
				email: "test@example.com",
				name: "Cher",
				message: "Single-name submitter wants to chat.",
			});

			const call = mockSubmitHubSpotForm.mock.calls[0]?.[0] as {
				fields: Array<{ name: string; value: string }>;
			};
			const names = call.fields.map((f) => f.name);
			expect(names).toContain("firstname");
			expect(names).not.toContain("lastname");
		});

		it("forwards hutk, pageUri, and pageName to HubSpot when supplied", async () => {
			const client = createClient();

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "Message with all attribution context attached.",
				hutk: "tracking-cookie",
				pageUri: "https://example.com/contact",
				pageName: "Contact",
			});

			expect(mockSubmitHubSpotForm).toHaveBeenCalledWith(
				expect.objectContaining({
					context: {
						hutk: "tracking-cookie",
						pageUri: "https://example.com/contact",
						pageName: "Contact",
					},
				}),
			);
		});

		it("falls back to email when the HubSpot submission fails", async () => {
			mockSubmitHubSpotForm.mockResolvedValueOnce({
				ok: false,
				status: 502,
			});

			const client = createClient();

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "This message should trigger the email fallback.",
			});

			expect(mockSubmitHubSpotForm).toHaveBeenCalledOnce();
			expect(mailFixture.sendEmail).toHaveBeenCalledOnce();
			expect(mailFixture.sendEmail).toHaveBeenCalledWith({
				to: config.contactForm.to,
				locale: "en",
				subject: config.contactForm.subject,
				text: "Name: John Doe\n\nEmail: test@example.com\n\nMessage: This message should trigger the email fallback.",
			});
		});

		it("falls back to email when HubSpot env vars are missing", async () => {
			process.env.HUBSPOT_PORTAL_ID = "";
			process.env.HUBSPOT_FORM_GUID = "";

			const client = createClient();

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "HubSpot is not configured here.",
			});

			expect(mockSubmitHubSpotForm).not.toHaveBeenCalled();
			expect(mailFixture.sendEmail).toHaveBeenCalledOnce();
		});

		it("throws INTERNAL_SERVER_ERROR when both HubSpot and email fail", async () => {
			mockSubmitHubSpotForm.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});
			mailFixture.sendEmail.mockRejectedValueOnce(
				new Error("Email service unavailable"),
			);

			const client = createClient();

			await expect(
				client({
					email: "test@example.com",
					name: "John Doe",
					message: "Everything is broken today.",
				}),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});

		it("throws INTERNAL_SERVER_ERROR when HubSpot fails and email returns false", async () => {
			mockSubmitHubSpotForm.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});
			mailFixture.sendEmail.mockResolvedValueOnce(false);

			const client = createClient();

			await expect(
				client({
					email: "test@example.com",
					name: "John Doe",
					message: "Email provider returned false here.",
				}),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});

		it("silently accepts submissions that fill the honeypot field", async () => {
			const client = createClient();

			await client({
				email: "spam@example.com",
				name: "Spammy McBot",
				message: "Buy my pills, lots of them, please click the link.",
				website: "https://buy-my-stuff.example",
			});

			expect(mockSubmitHubSpotForm).not.toHaveBeenCalled();
			expect(mailFixture.sendEmail).not.toHaveBeenCalled();
			expect(mockVerifyTurnstile).not.toHaveBeenCalled();
		});

		it("verifies Turnstile when TURNSTILE_SECRET_KEY is set", async () => {
			process.env.TURNSTILE_SECRET_KEY = "secret";

			const headers = new Headers({
				"accept-language": "en",
				"cf-connecting-ip": "203.0.113.5",
			});
			const client = createClient(headers);

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "Submission with a valid Turnstile token attached.",
				turnstileToken: "good-token",
			});

			expect(mockVerifyTurnstile).toHaveBeenCalledWith(
				"good-token",
				"secret",
				"203.0.113.5",
			);
			expect(mockSubmitHubSpotForm).toHaveBeenCalledOnce();
		});

		it("rejects submissions when Turnstile verification fails", async () => {
			process.env.TURNSTILE_SECRET_KEY = "secret";
			mockVerifyTurnstile.mockResolvedValueOnce({
				ok: false,
				reason: "invalid-input-response",
			});

			const client = createClient();

			await expect(
				client({
					email: "test@example.com",
					name: "John Doe",
					message: "Submission with a bad Turnstile token attached.",
					turnstileToken: "bad-token",
				}),
			).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});

			expect(mockSubmitHubSpotForm).not.toHaveBeenCalled();
			expect(mailFixture.sendEmail).not.toHaveBeenCalled();
		});

		it("skips Turnstile verification when TURNSTILE_SECRET_KEY is empty", async () => {
			const client = createClient();

			await client({
				email: "test@example.com",
				name: "John Doe",
				message: "Submission without Turnstile in this environment.",
			});

			expect(mockVerifyTurnstile).not.toHaveBeenCalled();
			expect(mockSubmitHubSpotForm).toHaveBeenCalledOnce();
		});

		it("always uses English locale (i18n removed)", async () => {
			mockSubmitHubSpotForm.mockResolvedValueOnce({
				ok: false,
				status: 502,
			});

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
				message: "Message in Spanish context here.",
			});

			// i18n removed - always uses "en" regardless of cookie
			expect(mailFixture.sendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					locale: "en",
				}),
			);
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
