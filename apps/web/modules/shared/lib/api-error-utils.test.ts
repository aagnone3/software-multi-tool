import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	classifyError,
	getErrorMessage,
	isApiInitializing,
	isTransientError,
	shouldShowRetry,
} from "./api-error-utils";

vi.mock("@repo/utils/lib/api-url", () => ({
	isPreviewEnvironment: vi.fn(() => false),
}));

import { isPreviewEnvironment } from "@repo/utils/lib/api-url";

const mockIsPreview = vi.mocked(isPreviewEnvironment);

beforeEach(() => {
	mockIsPreview.mockReturnValue(false);
});

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

	it("returns SERVER_ERROR for status 500", () => {
		expect(classifyError({ status: 500 })).toBe("SERVER_ERROR");
	});

	it("returns NETWORK_ERROR for TypeError with fetch message", () => {
		expect(classifyError(new TypeError("Failed to fetch"))).toBe(
			"NETWORK_ERROR",
		);
	});

	it("returns NETWORK_ERROR for Error with network in message", () => {
		expect(classifyError(new Error("network error"))).toBe("NETWORK_ERROR");
	});

	it("returns NOT_FOUND for Error with not found in message", () => {
		expect(classifyError(new Error("Resource not found"))).toBe(
			"NOT_FOUND",
		);
	});

	it("returns AUTH_ERROR for Error with unauthorized in message", () => {
		expect(classifyError(new Error("unauthorized"))).toBe("AUTH_ERROR");
	});

	it("returns UNKNOWN for unrecognized errors", () => {
		expect(classifyError("some string error")).toBe("UNKNOWN");
		expect(classifyError(null)).toBe("UNKNOWN");
		expect(classifyError(42)).toBe("UNKNOWN");
	});

	it("uses data.code over status for orpc errors", () => {
		expect(
			classifyError({ status: 503, data: { code: "API_UNREACHABLE" } }),
		).toBe("API_UNREACHABLE");
	});
});

describe("isApiInitializing", () => {
	it("returns false in non-preview environment", () => {
		mockIsPreview.mockReturnValue(false);
		expect(isApiInitializing({ status: 503 })).toBe(false);
	});

	it("returns true for API_NOT_CONFIGURED in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 503 })).toBe(true);
	});

	it("returns true for API_UNREACHABLE in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 502 })).toBe(true);
	});

	it("returns false for NOT_FOUND in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(isApiInitializing({ status: 404 })).toBe(false);
	});
});

describe("getErrorMessage", () => {
	it("returns preview-specific message for API_NOT_CONFIGURED in preview", () => {
		mockIsPreview.mockReturnValue(true);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toContain("preview API");
	});

	it("returns non-preview message for API_NOT_CONFIGURED outside preview", () => {
		mockIsPreview.mockReturnValue(false);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toBe(
			"API service is not configured.",
		);
	});

	it("returns message for NOT_FOUND", () => {
		expect(getErrorMessage("NOT_FOUND")).toBe(
			"The requested resource was not found.",
		);
	});

	it("returns message for NETWORK_ERROR", () => {
		expect(getErrorMessage("NETWORK_ERROR")).toContain("Network error");
	});

	it("returns default for UNKNOWN", () => {
		expect(getErrorMessage("UNKNOWN")).toContain("unexpected error");
	});
});

describe("shouldShowRetry", () => {
	it("returns true for API_UNREACHABLE", () => {
		expect(shouldShowRetry("API_UNREACHABLE")).toBe(true);
	});

	it("returns true for NETWORK_ERROR", () => {
		expect(shouldShowRetry("NETWORK_ERROR")).toBe(true);
	});

	it("returns true for SERVER_ERROR", () => {
		expect(shouldShowRetry("SERVER_ERROR")).toBe(true);
	});

	it("returns false for AUTH_ERROR", () => {
		expect(shouldShowRetry("AUTH_ERROR")).toBe(false);
	});
});

describe("isTransientError", () => {
	it("returns true for API_NOT_CONFIGURED", () => {
		expect(isTransientError("API_NOT_CONFIGURED")).toBe(true);
	});

	it("returns true for SERVER_ERROR", () => {
		expect(isTransientError("SERVER_ERROR")).toBe(true);
	});

	it("returns false for AUTH_ERROR", () => {
		expect(isTransientError("AUTH_ERROR")).toBe(false);
	});

	it("returns false for NOT_FOUND", () => {
		expect(isTransientError("NOT_FOUND")).toBe(false);
	});
});
