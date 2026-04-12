import { describe, expect, it } from "vitest";
import { defaultLocale, defaultTranslations } from "./translations";

describe("defaultLocale", () => {
	it("is English", () => {
		expect(defaultLocale).toBe("en");
	});
});

describe("defaultTranslations", () => {
	it("has a mail property", () => {
		expect(defaultTranslations).toHaveProperty("mail");
	});

	it("has common mail translations", () => {
		const { common } = defaultTranslations.mail;
		expect(common).toHaveProperty("openLinkInBrowser");
		expect(common).toHaveProperty("otp");
		expect(common).toHaveProperty("useLink");
		expect(typeof common.openLinkInBrowser).toBe("string");
	});

	it("has emailVerification translations with subject", () => {
		const { emailVerification } = defaultTranslations.mail;
		expect(emailVerification).toHaveProperty("subject");
		expect(emailVerification).toHaveProperty("body");
		expect(emailVerification).toHaveProperty("confirmEmail");
		expect(typeof emailVerification.subject).toBe("string");
		expect(emailVerification.subject.length).toBeGreaterThan(0);
	});

	it("has forgotPassword translations with subject", () => {
		const { forgotPassword } = defaultTranslations.mail;
		expect(forgotPassword).toHaveProperty("subject");
		expect(forgotPassword).toHaveProperty("body");
		expect(forgotPassword).toHaveProperty("resetPassword");
	});

	it("all template subjects are non-empty strings", () => {
		const mail = defaultTranslations.mail as Record<
			string,
			{ subject?: string }
		>;
		for (const [key, section] of Object.entries(mail)) {
			if (key === "common") {
				continue;
			}
			if (section.subject !== undefined) {
				expect(
					typeof section.subject,
					`${key}.subject should be a string`,
				).toBe("string");
				expect(
					section.subject.length,
					`${key}.subject should be non-empty`,
				).toBeGreaterThan(0);
			}
		}
	});
});
