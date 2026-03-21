import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@repo/config", () => ({
	config: {
		mails: { from: "no-reply@example.com" },
	},
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), log: vi.fn() },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("mail providers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("plunk provider", () => {
		it("sends email successfully", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });
			vi.stubEnv("PLUNK_API_KEY", "test-plunk-key");

			const { send } = await import("./plunk");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://next-api.useplunk.com/v1/send",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer test-plunk-key",
					}),
				}),
			);
		});

		it("throws on non-ok response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Bad request" }),
			});
			vi.stubEnv("PLUNK_API_KEY", "test-plunk-key");

			const { send } = await import("./plunk");
			await expect(
				send({
					to: "user@example.com",
					subject: "Test",
					html: "<p>Hello</p>",
					text: "Hello",
				}),
			).rejects.toThrow("Could not send email");
		});
	});

	describe("resend provider", () => {
		it("sends email successfully", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });
			vi.stubEnv("RESEND_API_KEY", "test-resend-key");

			const { send } = await import("./resend");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.resend.com/emails",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer test-resend-key",
					}),
				}),
			);
		});

		it("throws on non-ok response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Bad request" }),
			});

			const { send } = await import("./resend");
			await expect(
				send({
					to: "user@example.com",
					subject: "Test",
					html: "<p>Hello</p>",
					text: "Hello",
				}),
			).rejects.toThrow("Could not send email");
		});
	});

	describe("postmark provider", () => {
		it("sends email successfully", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });
			vi.stubEnv("POSTMARK_SERVER_TOKEN", "test-postmark-token");

			const { send } = await import("./postmark");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.postmarkapp.com/email",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"X-Postmark-Server-Token": "test-postmark-token",
					}),
				}),
			);
		});

		it("throws on non-ok response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Bad request" }),
			});

			const { send } = await import("./postmark");
			await expect(
				send({
					to: "user@example.com",
					subject: "Test",
					html: "<p>Hello</p>",
					text: "Hello",
				}),
			).rejects.toThrow("Could not send email");
		});
	});

	describe("console provider", () => {
		it("sends email without throwing", async () => {
			const { send } = await import("./console");
			await expect(
				send({
					to: "user@example.com",
					subject: "Test",
					html: "<p>Hello</p>",
					text: "Hello",
				}),
			).resolves.not.toThrow();
		});
	});

	describe("mailgun provider", () => {
		it("sends email successfully", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });
			vi.stubEnv("MAILGUN_DOMAIN", "test.mailgun.org");
			vi.stubEnv("MAILGUN_API_KEY", "test-mailgun-key");

			const { send } = await import("./mailgun");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.mailgun.net/v3/test.mailgun.org/messages",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: expect.stringContaining("Basic "),
					}),
				}),
			);
		});

		it("includes authorization header with base64-encoded api key", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });
			vi.stubEnv("MAILGUN_DOMAIN", "test.mailgun.org");
			vi.stubEnv("MAILGUN_API_KEY", "test-mailgun-key");

			const { send } = await import("./mailgun");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			const expectedAuth = `Basic ${Buffer.from("api:test-mailgun-key").toString("base64")}`;
			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: expectedAuth,
					}),
				}),
			);
		});

		it("throws on non-ok response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				text: async () => "error",
			});
			vi.stubEnv("MAILGUN_DOMAIN", "test.mailgun.org");
			vi.stubEnv("MAILGUN_API_KEY", "test-mailgun-key");

			const { send } = await import("./mailgun");
			await expect(
				send({
					to: "user@example.com",
					subject: "Test",
					html: "<p>Hello</p>",
					text: "Hello",
				}),
			).rejects.toThrow("Could not send email");
		});
	});

	describe("nodemailer provider", () => {
		it("sends email and passes correct transport config", async () => {
			const mockSendMail = vi.fn().mockResolvedValueOnce({});
			const mockCreateTransport = vi.fn().mockReturnValue({
				sendMail: mockSendMail,
			});
			vi.doMock("nodemailer", () => ({
				default: { createTransport: mockCreateTransport },
			}));

			vi.stubEnv("MAIL_HOST", "smtp.custom.com");
			vi.stubEnv("MAIL_PORT", "465");
			vi.stubEnv("MAIL_USER", "admin");
			vi.stubEnv("MAIL_PASS", "secret");

			const { send } = await import("./nodemailer");
			await send({
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
				text: "Hello",
			});

			expect(mockCreateTransport).toHaveBeenCalledWith(
				expect.objectContaining({
					host: "smtp.custom.com",
					port: 465,
					auth: { user: "admin", pass: "secret" },
				}),
			);
			expect(mockSendMail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: "user@example.com",
					subject: "Test",
				}),
			);
		});
	});
});
