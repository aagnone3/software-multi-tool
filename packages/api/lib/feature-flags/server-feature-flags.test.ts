import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create mocks that are available during module loading
const mockPostHogInstance = vi.hoisted(() => ({
	getFeatureFlag: vi.fn(),
	isFeatureEnabled: vi.fn(),
	getAllFlags: vi.fn(),
	shutdown: vi.fn().mockResolvedValue(undefined),
}));

// Mock PostHog module - use function keyword for proper constructor behavior
vi.mock("posthog-node", () => ({
	PostHog: vi.fn(function (this: unknown) {
		return mockPostHogInstance;
	}),
}));

// Mock logger
vi.mock("@repo/logs", () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

import {
	getAllFeatureFlags,
	getFeatureFlag,
	isFeatureEnabled,
	ServerFeatureFlagService,
	serverFeatureFlags,
} from "./server-feature-flags";

describe("Server Feature Flags", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("ServerFeatureFlagService (disabled - test mode)", () => {
		it("should be disabled in test environment", () => {
			expect(serverFeatureFlags.isEnabled()).toBe(false);
		});

		it("should return defaultValue when disabled", async () => {
			const result = await serverFeatureFlags.getFeatureFlag(
				"test-flag",
				"user-123",
				{ defaultValue: "default-value" },
			);
			expect(result).toBe("default-value");
		});

		it("should return undefined when disabled and no default", async () => {
			const result = await serverFeatureFlags.getFeatureFlag(
				"test-flag",
				"user-123",
			);
			expect(result).toBeUndefined();
		});

		it("should return false for isFeatureEnabled when disabled", async () => {
			const result = await serverFeatureFlags.isFeatureEnabled(
				"test-flag",
				"user-123",
			);
			expect(result).toBe(false);
		});

		it("should return empty object for getAllFeatureFlags when disabled", async () => {
			const result =
				await serverFeatureFlags.getAllFeatureFlags("user-123");
			expect(result).toEqual({});
		});
	});

	describe("ServerFeatureFlagService (enabled)", () => {
		let service: ServerFeatureFlagService;

		beforeEach(() => {
			// Reset all mock function states
			mockPostHogInstance.getFeatureFlag.mockReset();
			mockPostHogInstance.isFeatureEnabled.mockReset();
			mockPostHogInstance.getAllFlags.mockReset();
			mockPostHogInstance.shutdown
				.mockReset()
				.mockResolvedValue(undefined);

			service = new ServerFeatureFlagService({
				apiKey: "test-api-key",
				host: "https://test.posthog.com",
				enabled: true,
			});
		});

		describe("getFeatureFlag", () => {
			it("should return flag value from PostHog", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(
					"variant-a",
				);

				const result = await service.getFeatureFlag(
					"test-flag",
					"user-123",
				);

				expect(result).toBe("variant-a");
				expect(mockPostHogInstance.getFeatureFlag).toHaveBeenCalledWith(
					"test-flag",
					"user-123",
					expect.any(Object),
				);
			});

			it("should return boolean flag value", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(true);

				const result = await service.getFeatureFlag(
					"enabled-flag",
					"user-123",
				);

				expect(result).toBe(true);
			});

			it("should return default value when flag is null", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(null);

				const result = await service.getFeatureFlag(
					"test-flag",
					"user-123",
					{
						defaultValue: "fallback",
					},
				);

				expect(result).toBe("fallback");
			});

			it("should return default value when flag is undefined", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(undefined);

				const result = await service.getFeatureFlag(
					"test-flag",
					"user-123",
					{
						defaultValue: false,
					},
				);

				expect(result).toBe(false);
			});

			it("should pass person properties to PostHog", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(true);

				await service.getFeatureFlag("test-flag", "user-123", {
					properties: { plan: "pro" },
				});

				expect(mockPostHogInstance.getFeatureFlag).toHaveBeenCalledWith(
					"test-flag",
					"user-123",
					expect.objectContaining({
						personProperties: { plan: "pro" },
					}),
				);
			});

			it("should pass groups to PostHog", async () => {
				mockPostHogInstance.getFeatureFlag.mockResolvedValue(true);

				await service.getFeatureFlag("test-flag", "user-123", {
					groups: { company: "acme" },
				});

				expect(mockPostHogInstance.getFeatureFlag).toHaveBeenCalledWith(
					"test-flag",
					"user-123",
					expect.objectContaining({
						groups: { company: "acme" },
					}),
				);
			});

			it("should return default value on error", async () => {
				mockPostHogInstance.getFeatureFlag.mockRejectedValue(
					new Error("Network error"),
				);

				const result = await service.getFeatureFlag(
					"test-flag",
					"user-123",
					{
						defaultValue: "error-fallback",
					},
				);

				expect(result).toBe("error-fallback");
			});

			it("should handle non-Error exceptions", async () => {
				mockPostHogInstance.getFeatureFlag.mockRejectedValue(
					"String error",
				);

				const result = await service.getFeatureFlag(
					"test-flag",
					"user-123",
					{
						defaultValue: "fallback",
					},
				);

				expect(result).toBe("fallback");
			});
		});

		describe("isFeatureEnabled", () => {
			it("should return true when flag is enabled", async () => {
				mockPostHogInstance.isFeatureEnabled.mockResolvedValue(true);

				const result = await service.isFeatureEnabled(
					"test-flag",
					"user-123",
				);

				expect(result).toBe(true);
			});

			it("should return false when flag is disabled", async () => {
				mockPostHogInstance.isFeatureEnabled.mockResolvedValue(false);

				const result = await service.isFeatureEnabled(
					"test-flag",
					"user-123",
				);

				expect(result).toBe(false);
			});

			it("should return false when result is null", async () => {
				mockPostHogInstance.isFeatureEnabled.mockResolvedValue(null);

				const result = await service.isFeatureEnabled(
					"test-flag",
					"user-123",
				);

				expect(result).toBe(false);
			});

			it("should return default value when result is null", async () => {
				mockPostHogInstance.isFeatureEnabled.mockResolvedValue(null);

				const result = await service.isFeatureEnabled(
					"test-flag",
					"user-123",
					{
						defaultValue: true,
					},
				);

				expect(result).toBe(true);
			});

			it("should return default value on error", async () => {
				mockPostHogInstance.isFeatureEnabled.mockRejectedValue(
					new Error("Network error"),
				);

				const result = await service.isFeatureEnabled(
					"test-flag",
					"user-123",
					{
						defaultValue: true,
					},
				);

				expect(result).toBe(true);
			});
		});

		describe("getAllFeatureFlags", () => {
			it("should return all flags from PostHog", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": true,
					"flag-b": "variant-1",
					"flag-c": false,
				});

				const result = await service.getAllFeatureFlags("user-123");

				expect(result).toEqual({
					"flag-a": true,
					"flag-b": "variant-1",
					"flag-c": false,
				});
			});

			it("should normalize non-string/boolean values to strings", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": 123,
					"flag-b": { variant: "a" },
				});

				const result = await service.getAllFeatureFlags("user-123");

				expect(result).toEqual({
					"flag-a": "123",
					"flag-b": "[object Object]",
				});
			});

			it("should skip null/undefined values", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": true,
					"flag-b": null,
					"flag-c": undefined,
				});

				const result = await service.getAllFeatureFlags("user-123");

				expect(result).toEqual({
					"flag-a": true,
				});
			});

			it("should cache results", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": true,
				});

				// First call
				await service.getAllFeatureFlags("user-123");
				// Second call (should use cache)
				await service.getAllFeatureFlags("user-123");

				// PostHog should only be called once
				expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledTimes(
					1,
				);
			});

			it("should return different results for different users", async () => {
				mockPostHogInstance.getAllFlags
					.mockResolvedValueOnce({ "flag-a": true })
					.mockResolvedValueOnce({ "flag-a": false });

				const result1 = await service.getAllFeatureFlags("user-1");
				const result2 = await service.getAllFeatureFlags("user-2");

				expect(result1).toEqual({ "flag-a": true });
				expect(result2).toEqual({ "flag-a": false });
				expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledTimes(
					2,
				);
			});

			it("should return empty object on error", async () => {
				mockPostHogInstance.getAllFlags.mockRejectedValue(
					new Error("Network error"),
				);

				const result = await service.getAllFeatureFlags("user-123");

				expect(result).toEqual({});
			});
		});

		describe("clearCache", () => {
			it("should clear cache for specific user", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": true,
				});

				await service.getAllFeatureFlags("user-123");
				service.clearCache("user-123");
				await service.getAllFeatureFlags("user-123");

				expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledTimes(
					2,
				);
			});

			it("should clear all cache when no user specified", async () => {
				mockPostHogInstance.getAllFlags.mockResolvedValue({
					"flag-a": true,
				});

				await service.getAllFeatureFlags("user-1");
				await service.getAllFeatureFlags("user-2");
				service.clearCache();
				await service.getAllFeatureFlags("user-1");
				await service.getAllFeatureFlags("user-2");

				expect(mockPostHogInstance.getAllFlags).toHaveBeenCalledTimes(
					4,
				);
			});
		});

		describe("shutdown", () => {
			it("should call PostHog shutdown", async () => {
				await service.shutdown();

				expect(mockPostHogInstance.shutdown).toHaveBeenCalled();
			});

			it("should handle shutdown errors gracefully", async () => {
				mockPostHogInstance.shutdown.mockRejectedValue(
					new Error("Shutdown error"),
				);

				// Should not throw
				await expect(service.shutdown()).resolves.toBeUndefined();
			});
		});

		describe("isEnabled", () => {
			it("should return true when enabled", () => {
				expect(service.isEnabled()).toBe(true);
			});
		});
	});

	describe("Convenience functions", () => {
		it("getFeatureFlag delegates to singleton", async () => {
			const result = await getFeatureFlag("test-flag", "user-123", {
				defaultValue: "default",
			});
			expect(result).toBe("default"); // Disabled in test mode
		});

		it("isFeatureEnabled delegates to singleton", async () => {
			const result = await isFeatureEnabled("test-flag", "user-123");
			expect(result).toBe(false); // Disabled in test mode
		});

		it("getAllFeatureFlags delegates to singleton", async () => {
			const result = await getAllFeatureFlags("user-123");
			expect(result).toEqual({}); // Disabled in test mode
		});
	});
});
