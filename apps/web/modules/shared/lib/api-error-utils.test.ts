import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/utils/lib/api-url", () => ({
	isPreviewEnvironment: vi.fn(() => false),
}));

import { isPreviewEnvironment } from "@repo/utils/lib/api-url";
import {
	type ApiErrorCode,
	classifyError,
	getErrorMessage,
	isApiInitializing,
	isTransientError,
	shouldShowRetry,
} from "./api-error-utils";

const mockIsPreview = vi.mocked(isPreviewEnvironment);

describe("classifyError", () => {
	it("returns API_NOT_CONFIGURED for explicit code", () => {
		expect(classifyError({ code: "API_NOT_CONFIGURED" })).toBe(
			"API_NOT_CONFIGURED",
		);
	});

	it("returns API_UNREACHABLE for explicit code", () => {
		expect(classifyError({ code: "API_UNREACHABLE" })).toBe(
			"API_UNREACHABLE",
		);
	});

	it("returns API_NOT_CONFIGURED for status 503", () => {
		expect(classifyError({ status: 503 })).toBe("API_NOT_CONFIGURED");
	});

	it("returns API_UNREACHABLE for status 502", () => {
		expect(classifyError({ status: 502 })).toBe("API_UNREACHABLE");
	});

	it("returns NOT_FOUND for status 404", () => {
		expect(classifyError({ status: 404 })).toBe("NOT_FOUND");
	});

	it("returns AUTH_ERROR for status 401", () => {
		expect(classifyError({ status: 401 })).toBe("AUTH_ERROR");
	});

	it("returns AUTH_ERROR for status 403", () => {
		expect(classifyError({ status: 403 })).toBe("AUTH_ERROR");
	});

	it("returns VALIDATION_ERROR for status 400", () => {
		expect(classifyError({ status: 400 })).toBe("VALIDATION_ERROR");
	});

	it("returns SERVER_ERROR for status 500+", () => {
		expect(classifyError({ status: 500 })).toBe("SERVER_ERROR");
		expect(classifyError({ status: 501 })).toBe("SERVER_ERROR");
	});

	it("returns NETWORK_ERROR for TypeError with fetch message", () => {
		expect(classifyError(new TypeError("Failed to fetch"))).toBe(
			"NETWORK_ERROR",
		);
	});

	it("returns NETWORK_ERROR for Error with network in message", () => {
		expect(classifyError(new Error("network failure"))).toBe(
			"NETWORK_ERROR",
		);
	});

	it("returns NOT_FOUND for Error with not found message", () => {
		expect(classifyError(new Error("Resource not found"))).toBe(
			"NOT_FOUND",
		);
	});

	it("returns AUTH_ERROR for Error with unauthorized message", () => {
		expect(classifyError(new Error("unauthorized access"))).toBe(
			"AUTH_ERROR",
		);
	});

	it("returns UNKNOWN for unrecognized errors", () => {
		expect(classifyError(null)).toBe("UNKNOWN");
		expect(classifyError("some string error")).toBe("UNKNOWN");
		expect(classifyError(42)).toBe("UNKNOWN");
	});

	it("uses data.code when code is in nested data", () => {
		expect(
			classifyError({
				status: 503,
				data: { code: "API_NOT_CONFIGURED" },
			}),
		).toBe("API_NOT_CONFIGURED");
	});
});

describe("isApiInitializing", () => {
	it("returns false in non-preview environment", () => {
		mockIsPreview.mockReturnValue(false);
		expect(isApiInitializing({ code: "API_NOT_CONFIGURED" })).toBe(false);
	});

	it("returns true for API_NOT_CONFIGURED in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 503 })).toBe(true);
	});

	it("returns true for API_UNREACHABLE in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 502 })).toBe(true);
	});

	it("returns false for other errors in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 404 })).toBe(false);
	});
});

describe("getErrorMessage", () => {
	it("returns preview message for API_NOT_CONFIGURED in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toContain("initializing");
	});

	it("returns non-preview message for API_NOT_CONFIGURED outside preview", () => {
		mockIsPreview.mockReturnValue(false);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toContain(
			"not configured",
		);
	});

	it("returns preview message for API_UNREACHABLE in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(getErrorMessage("API_UNREACHABLE")).toContain("deploying");
	});

	it("returns a string for all error codes", () => {
		mockIsPreview.mockReturnValue(false);
		const codes: ApiErrorCode[] = [
			"API_NOT_CONFIGURED",
			"API_UNREACHABLE",
			"NOT_FOUND",
			"AUTH_ERROR",
			"VALIDATION_ERROR",
			"SERVER_ERROR",
			"NETWORK_ERROR",
			"UNKNOWN",
		];
		for (const code of codes) {
			expect(typeof getErrorMessage(code)).toBe("string");
		}
	});
});

describe("shouldShowRetry", () => {
	it("returns true for retryable errors", () => {
		expect(shouldShowRetry("API_UNREACHABLE")).toBe(true);
		expect(shouldShowRetry("NETWORK_ERROR")).toBe(true);
		expect(shouldShowRetry("SERVER_ERROR")).toBe(true);
	});

	it("returns false for non-retryable errors", () => {
		expect(shouldShowRetry("NOT_FOUND")).toBe(false);
		expect(shouldShowRetry("AUTH_ERROR")).toBe(false);
		expect(shouldShowRetry("VALIDATION_ERROR")).toBe(false);
		expect(shouldShowRetry("UNKNOWN")).toBe(false);
	});
});

describe("isTransientError", () => {
	it("returns true for transient errors", () => {
		expect(isTransientError("API_NOT_CONFIGURED")).toBe(true);
		expect(isTransientError("API_UNREACHABLE")).toBe(true);
		expect(isTransientError("NETWORK_ERROR")).toBe(true);
		expect(isTransientError("SERVER_ERROR")).toBe(true);
	});

	it("returns false for permanent errors", () => {
		expect(isTransientError("NOT_FOUND")).toBe(false);
		expect(isTransientError("AUTH_ERROR")).toBe(false);
		expect(isTransientError("VALIDATION_ERROR")).toBe(false);
		expect(isTransientError("UNKNOWN")).toBe(false);
	});
});
