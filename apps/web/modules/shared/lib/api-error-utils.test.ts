import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("api-error-utils", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	async function importModule() {
		const module = await import("./api-error-utils");
		return module;
	}

	describe("classifyError", () => {
		it("returns API_NOT_CONFIGURED for 503 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 503 };
			expect(classifyError(error)).toBe("API_NOT_CONFIGURED");
		});

		it("returns API_NOT_CONFIGURED for explicit code", async () => {
			const { classifyError } = await importModule();
			const error = { status: 503, code: "API_NOT_CONFIGURED" };
			expect(classifyError(error)).toBe("API_NOT_CONFIGURED");
		});

		it("returns API_UNREACHABLE for 502 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 502 };
			expect(classifyError(error)).toBe("API_UNREACHABLE");
		});

		it("returns API_UNREACHABLE for explicit code", async () => {
			const { classifyError } = await importModule();
			const error = { status: 502, code: "API_UNREACHABLE" };
			expect(classifyError(error)).toBe("API_UNREACHABLE");
		});

		it("returns NOT_FOUND for 404 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 404 };
			expect(classifyError(error)).toBe("NOT_FOUND");
		});

		it("returns AUTH_ERROR for 401 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 401 };
			expect(classifyError(error)).toBe("AUTH_ERROR");
		});

		it("returns AUTH_ERROR for 403 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 403 };
			expect(classifyError(error)).toBe("AUTH_ERROR");
		});

		it("returns VALIDATION_ERROR for 400 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 400 };
			expect(classifyError(error)).toBe("VALIDATION_ERROR");
		});

		it("returns SERVER_ERROR for 500 status", async () => {
			const { classifyError } = await importModule();
			const error = { status: 500 };
			expect(classifyError(error)).toBe("SERVER_ERROR");
		});

		it("returns NETWORK_ERROR for fetch TypeError", async () => {
			const { classifyError } = await importModule();
			const error = new TypeError("Failed to fetch");
			expect(classifyError(error)).toBe("NETWORK_ERROR");
		});

		it("returns UNKNOWN for unrecognized errors", async () => {
			const { classifyError } = await importModule();
			expect(classifyError("random string")).toBe("UNKNOWN");
			expect(classifyError(null)).toBe("UNKNOWN");
			expect(classifyError(undefined)).toBe("UNKNOWN");
		});

		it("classifies error with data.code property", async () => {
			const { classifyError } = await importModule();
			const error = { status: 200, data: { code: "API_NOT_CONFIGURED" } };
			expect(classifyError(error)).toBe("API_NOT_CONFIGURED");
		});
	});

	describe("isApiInitializing", () => {
		it("returns false in non-preview environment", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			const { isApiInitializing } = await importModule();
			const error = { status: 503, code: "API_NOT_CONFIGURED" };
			expect(isApiInitializing(error)).toBe(false);
		});

		it("returns true for API_NOT_CONFIGURED in preview", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { isApiInitializing } = await importModule();
			const error = { status: 503, code: "API_NOT_CONFIGURED" };
			expect(isApiInitializing(error)).toBe(true);
		});

		it("returns true for API_UNREACHABLE in preview", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { isApiInitializing } = await importModule();
			const error = { status: 502, code: "API_UNREACHABLE" };
			expect(isApiInitializing(error)).toBe(true);
		});

		it("returns false for NOT_FOUND in preview", async () => {
			process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			const { isApiInitializing } = await importModule();
			const error = { status: 404 };
			expect(isApiInitializing(error)).toBe(false);
		});
	});

	describe("getErrorMessage", () => {
		describe("in preview environment", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
			});

			it("returns preview-specific message for API_NOT_CONFIGURED", async () => {
				const { getErrorMessage } = await importModule();
				expect(getErrorMessage("API_NOT_CONFIGURED")).toContain(
					"preview API is still initializing",
				);
			});

			it("returns preview-specific message for API_UNREACHABLE", async () => {
				const { getErrorMessage } = await importModule();
				expect(getErrorMessage("API_UNREACHABLE")).toContain(
					"preview API server is unreachable",
				);
			});
		});

		describe("in production environment", () => {
			beforeEach(() => {
				process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
			});

			it("returns production message for API_NOT_CONFIGURED", async () => {
				const { getErrorMessage } = await importModule();
				expect(getErrorMessage("API_NOT_CONFIGURED")).toBe(
					"API service is not configured.",
				);
			});

			it("returns production message for API_UNREACHABLE", async () => {
				const { getErrorMessage } = await importModule();
				expect(getErrorMessage("API_UNREACHABLE")).toBe(
					"Unable to reach the API server. Please try again later.",
				);
			});
		});

		it("returns appropriate messages for other error codes", async () => {
			const { getErrorMessage } = await importModule();

			expect(getErrorMessage("NOT_FOUND")).toBe(
				"The requested resource was not found.",
			);
			expect(getErrorMessage("AUTH_ERROR")).toBe(
				"Authentication required. Please sign in.",
			);
			expect(getErrorMessage("VALIDATION_ERROR")).toBe(
				"Invalid request. Please check your input.",
			);
			expect(getErrorMessage("SERVER_ERROR")).toBe(
				"A server error occurred. Please try again later.",
			);
			expect(getErrorMessage("NETWORK_ERROR")).toBe(
				"Network error. Please check your connection.",
			);
			expect(getErrorMessage("UNKNOWN")).toBe(
				"An unexpected error occurred. Please try again.",
			);
		});
	});

	describe("shouldShowRetry", () => {
		it("returns true for retryable errors", async () => {
			const { shouldShowRetry } = await importModule();
			expect(shouldShowRetry("API_UNREACHABLE")).toBe(true);
			expect(shouldShowRetry("NETWORK_ERROR")).toBe(true);
			expect(shouldShowRetry("SERVER_ERROR")).toBe(true);
		});

		it("returns false for non-retryable errors", async () => {
			const { shouldShowRetry } = await importModule();
			expect(shouldShowRetry("API_NOT_CONFIGURED")).toBe(false);
			expect(shouldShowRetry("NOT_FOUND")).toBe(false);
			expect(shouldShowRetry("AUTH_ERROR")).toBe(false);
			expect(shouldShowRetry("VALIDATION_ERROR")).toBe(false);
		});
	});

	describe("isTransientError", () => {
		it("returns true for transient errors", async () => {
			const { isTransientError } = await importModule();
			expect(isTransientError("API_NOT_CONFIGURED")).toBe(true);
			expect(isTransientError("API_UNREACHABLE")).toBe(true);
			expect(isTransientError("NETWORK_ERROR")).toBe(true);
			expect(isTransientError("SERVER_ERROR")).toBe(true);
		});

		it("returns false for permanent errors", async () => {
			const { isTransientError } = await importModule();
			expect(isTransientError("NOT_FOUND")).toBe(false);
			expect(isTransientError("AUTH_ERROR")).toBe(false);
			expect(isTransientError("VALIDATION_ERROR")).toBe(false);
		});
	});
});
