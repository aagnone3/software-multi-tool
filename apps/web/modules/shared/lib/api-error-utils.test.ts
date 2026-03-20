import { describe, expect, it, vi } from "vitest";

const mockIsPreviewEnvironment = vi.hoisted(() => vi.fn(() => false));

vi.mock("@repo/utils/lib/api-url", () => ({
	isPreviewEnvironment: mockIsPreviewEnvironment,
}));

import {
	classifyError,
	getErrorMessage,
	isApiInitializing,
	isTransientError,
	shouldShowRetry,
} from "./api-error-utils";

describe("classifyError", () => {
	it("returns API_NOT_CONFIGURED for code API_NOT_CONFIGURED", () => {
		expect(classifyError({ code: "API_NOT_CONFIGURED" })).toBe(
			"API_NOT_CONFIGURED",
		);
	});

	it("returns API_UNREACHABLE for code API_UNREACHABLE", () => {
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

	it("returns NETWORK_ERROR for fetch TypeError", () => {
		expect(classifyError(new TypeError("Failed to fetch"))).toBe(
			"NETWORK_ERROR",
		);
	});

	it("returns NOT_FOUND for error message containing not found", () => {
		expect(classifyError(new Error("Resource not found"))).toBe(
			"NOT_FOUND",
		);
	});

	it("returns AUTH_ERROR for error message containing unauthorized", () => {
		expect(classifyError(new Error("unauthorized access"))).toBe(
			"AUTH_ERROR",
		);
	});

	it("returns UNKNOWN for unrecognized error", () => {
		expect(classifyError(new Error("something random"))).toBe("UNKNOWN");
	});

	it("returns UNKNOWN for null", () => {
		expect(classifyError(null)).toBe("UNKNOWN");
	});

	it("prefers data.code over status", () => {
		expect(
			classifyError({ status: 503, data: { code: "API_UNREACHABLE" } }),
		).toBe("API_UNREACHABLE");
	});
});

describe("isApiInitializing", () => {
	it("returns false in non-preview environment", () => {
		mockIsPreviewEnvironment.mockReturnValue(false);
		expect(isApiInitializing({ status: 503 })).toBe(false);
	});

	it("returns true in preview environment for API_NOT_CONFIGURED", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		expect(isApiInitializing({ status: 503 })).toBe(true);
	});

	it("returns true in preview environment for API_UNREACHABLE", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		expect(isApiInitializing({ status: 502 })).toBe(true);
	});

	it("returns false for non-initializing errors in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		expect(isApiInitializing({ status: 404 })).toBe(false);
	});
});

describe("getErrorMessage", () => {
	it("returns initializing message for API_NOT_CONFIGURED in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toContain("preview");
	});

	it("returns generic message for API_NOT_CONFIGURED outside preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(false);
		expect(getErrorMessage("API_NOT_CONFIGURED")).toBe(
			"API service is not configured.",
		);
	});

	it("returns expected message for NOT_FOUND", () => {
		expect(getErrorMessage("NOT_FOUND")).toBe(
			"The requested resource was not found.",
		);
	});

	it("returns expected message for NETWORK_ERROR", () => {
		expect(getErrorMessage("NETWORK_ERROR")).toContain("Network error");
	});

	it("returns fallback for UNKNOWN", () => {
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

	it("returns false for NOT_FOUND", () => {
		expect(shouldShowRetry("NOT_FOUND")).toBe(false);
	});
});

describe("isTransientError", () => {
	it("returns true for API_NOT_CONFIGURED", () => {
		expect(isTransientError("API_NOT_CONFIGURED")).toBe(true);
	});

	it("returns true for NETWORK_ERROR", () => {
		expect(isTransientError("NETWORK_ERROR")).toBe(true);
	});

	it("returns false for AUTH_ERROR", () => {
		expect(isTransientError("AUTH_ERROR")).toBe(false);
	});
});
