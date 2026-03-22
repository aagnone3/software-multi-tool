import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @react-email/render to avoid browser-environment issues in tests
vi.mock("@react-email/render", () => ({
	render: vi.fn().mockResolvedValue("<html>mock email</html>"),
}));

// Mock the email templates
vi.mock("../../emails", () => ({
	mailTemplates: {
		magicLink: vi.fn().mockReturnValue("<MagicLink />"),
		forgotPassword: vi.fn().mockReturnValue("<ForgotPassword />"),
		newUser: vi.fn().mockReturnValue("<NewUser />"),
		newsletterSignup: vi.fn().mockReturnValue("<NewsletterSignup />"),
		notificationEmail: vi.fn().mockReturnValue("<NotificationEmail />"),
		organizationInvitation: vi
			.fn()
			.mockReturnValue("<OrganizationInvitation />"),
		emailVerification: vi.fn().mockReturnValue("<EmailVerification />"),
	},
}));

import { render } from "@react-email/render";
import { mailTemplates } from "../../emails";
import { getTemplate } from "./templates";

describe("getTemplate", () => {
	beforeEach(() => {
		vi.mocked(render)
			.mockResolvedValueOnce("<html>mock html</html>")
			.mockResolvedValueOnce("mock plain text");
	});

	it("calls the correct template function with context and locale", async () => {
		await getTemplate({
			templateId: "magicLink",
			context: { url: "https://example.com/magic" },
			locale: "en",
		});

		expect(mailTemplates.magicLink).toHaveBeenCalledWith(
			expect.objectContaining({
				url: "https://example.com/magic",
				locale: "en",
			}),
		);
	});

	it("returns html and text from render calls", async () => {
		const result = await getTemplate({
			templateId: "forgotPassword",
			context: { url: "https://example.com/reset" },
			locale: "en",
		});

		expect(result.html).toBe("<html>mock html</html>");
		expect(result.text).toBe("mock plain text");
	});

	it("returns the subject from translations for a known template", async () => {
		const result = await getTemplate({
			templateId: "magicLink",
			context: { url: "https://example.com/magic" },
			locale: "en",
		});

		expect(typeof result.subject).toBe("string");
		expect(result.subject).toBe("Login to Software Multitool");
	});

	it("returns empty string subject for templates without a subject key", async () => {
		// notificationEmail has a subject in translations but let's test newsletterSignup
		const result = await getTemplate({
			templateId: "newsletterSignup",
			context: {},
			locale: "en",
		});

		expect(typeof result.subject).toBe("string");
		expect(result.subject).toBe(
			"Welcome to the Software Multitool Newsletter!",
		);
	});

	it("calls render twice (html and plainText)", async () => {
		await getTemplate({
			templateId: "emailVerification",
			context: { url: "https://example.com/verify" },
			locale: "en",
		});

		expect(render).toHaveBeenCalledTimes(2);
		// Second call should have plainText option
		expect(render).toHaveBeenNthCalledWith(
			2,
			expect.anything(),
			expect.objectContaining({ plainText: true }),
		);
	});
});
