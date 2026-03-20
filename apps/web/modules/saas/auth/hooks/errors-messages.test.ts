import { describe, expect, it } from "vitest";
import { useAuthErrorMessages } from "./errors-messages";

describe("useAuthErrorMessages", () => {
	const { getAuthErrorMessage } = useAuthErrorMessages();

	it("returns a known error message for a defined error code", () => {
		expect(getAuthErrorMessage("INVALID_EMAIL_OR_PASSWORD")).toBe(
			"Your login credentials are incorrect.",
		);
	});

	it("returns the email-not-verified message", () => {
		expect(getAuthErrorMessage("EMAIL_NOT_VERIFIED")).toContain(
			"has not been verified",
		);
	});

	it("returns the fallback message for an unknown error code", () => {
		expect(getAuthErrorMessage("TOTALLY_UNKNOWN_CODE")).toBe(
			"There was an error. Please try again later.",
		);
	});

	it("returns the fallback message for undefined", () => {
		expect(getAuthErrorMessage(undefined)).toBe(
			"There was an error. Please try again later.",
		);
	});

	it("covers all defined error codes without throwing", () => {
		const codes = [
			"INVALID_EMAIL_OR_PASSWORD",
			"USER_NOT_FOUND",
			"FAILED_TO_CREATE_USER",
			"FAILED_TO_CREATE_SESSION",
			"FAILED_TO_UPDATE_USER",
			"FAILED_TO_GET_SESSION",
			"INVALID_PASSWORD",
			"INVALID_EMAIL",
			"INVALID_TOKEN",
			"CREDENTIAL_ACCOUNT_NOT_FOUND",
			"EMAIL_CAN_NOT_BE_UPDATED",
			"EMAIL_NOT_VERIFIED",
			"FAILED_TO_GET_USER_INFO",
			"ID_TOKEN_NOT_SUPPORTED",
			"PASSWORD_TOO_LONG",
			"PASSWORD_TOO_SHORT",
			"PROVIDER_NOT_FOUND",
			"SOCIAL_ACCOUNT_ALREADY_LINKED",
			"USER_EMAIL_NOT_FOUND",
			"USER_ALREADY_EXISTS",
			"INVALID_INVITATION",
			"SESSION_EXPIRED",
			"FAILED_TO_UNLINK_LAST_ACCOUNT",
			"ACCOUNT_NOT_FOUND",
			"INVALID_TWO_FACTOR_CODE",
		];
		for (const code of codes) {
			const msg = getAuthErrorMessage(code);
			expect(typeof msg).toBe("string");
			expect(msg.length).toBeGreaterThan(0);
			// Should not fall back to generic message for known codes
			expect(msg).not.toBe("There was an error. Please try again later.");
		}
	});
});
