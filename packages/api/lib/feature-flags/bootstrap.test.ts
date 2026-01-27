import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_FEATURE_FLAGS,
	getBootstrapFlag,
	getBootstrapFlags,
	isBootstrapFeatureEnabled,
} from "./bootstrap";
import { serverFeatureFlags } from "./server-feature-flags";

// Mock the serverFeatureFlags module
vi.mock("./server-feature-flags", () => ({
	serverFeatureFlags: {
		isEnabled: vi.fn(),
		getAllFeatureFlags: vi.fn(),
		getFeatureFlag: vi.fn(),
		isFeatureEnabled: vi.fn(),
	},
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

describe("Bootstrap Feature Flags", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("DEFAULT_FEATURE_FLAGS", () => {
		it("should be an object", () => {
			expect(typeof DEFAULT_FEATURE_FLAGS).toBe("object");
		});
	});

	describe("getBootstrapFlags", () => {
		it("should return defaults when service is disabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(false);

			const result = await getBootstrapFlags("user-123", {
				defaults: { "my-flag": true },
			});

			expect(result).toEqual({ "my-flag": true });
			expect(
				serverFeatureFlags.getAllFeatureFlags,
			).not.toHaveBeenCalled();
		});

		it("should merge PostHog flags with defaults", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockResolvedValue({
				"posthog-flag": "variant-a",
			});

			const result = await getBootstrapFlags("user-123", {
				defaults: { "default-flag": false },
			});

			expect(result).toEqual({
				"default-flag": false,
				"posthog-flag": "variant-a",
			});
		});

		it("should let PostHog flags override defaults", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockResolvedValue({
				"shared-flag": true,
			});

			const result = await getBootstrapFlags("user-123", {
				defaults: { "shared-flag": false },
			});

			expect(result["shared-flag"]).toBe(true);
		});

		it("should return only defaults when PostHog returns empty", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockResolvedValue(
				{},
			);

			const result = await getBootstrapFlags("user-123", {
				defaults: { "default-flag": "value" },
			});

			expect(result).toEqual({ "default-flag": "value" });
		});

		it("should return defaults on error", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockRejectedValue(
				new Error("Network error"),
			);

			const result = await getBootstrapFlags("user-123", {
				defaults: { "fallback-flag": true },
			});

			expect(result).toEqual({ "fallback-flag": true });
		});

		it("should pass properties to getAllFeatureFlags", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockResolvedValue(
				{},
			);

			await getBootstrapFlags("user-123", {
				properties: { plan: "pro" },
			});

			expect(serverFeatureFlags.getAllFeatureFlags).toHaveBeenCalledWith(
				"user-123",
				expect.objectContaining({
					properties: { plan: "pro" },
				}),
			);
		});

		it("should pass groups to getAllFeatureFlags", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getAllFeatureFlags).mockResolvedValue(
				{},
			);

			await getBootstrapFlags("user-123", {
				groups: { company: "acme" },
			});

			expect(serverFeatureFlags.getAllFeatureFlags).toHaveBeenCalledWith(
				"user-123",
				expect.objectContaining({
					groups: { company: "acme" },
				}),
			);
		});

		it("should merge DEFAULT_FEATURE_FLAGS with custom defaults", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(false);

			const result = await getBootstrapFlags("user-123", {
				defaults: { "custom-flag": true },
			});

			// Should include both DEFAULT_FEATURE_FLAGS and custom defaults
			expect(result).toEqual({
				...DEFAULT_FEATURE_FLAGS,
				"custom-flag": true,
			});
		});
	});

	describe("getBootstrapFlag", () => {
		it("should return default when service is disabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(false);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				"default-value",
			);

			expect(result).toBe("default-value");
			expect(serverFeatureFlags.getFeatureFlag).not.toHaveBeenCalled();
		});

		it("should return flag value from PostHog", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockResolvedValue(
				"posthog-value",
			);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				"default-value",
			);

			expect(result).toBe("posthog-value");
		});

		it("should return boolean flag value", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockResolvedValue(
				true,
			);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				false,
			);

			expect(result).toBe(true);
		});

		it("should return default when PostHog returns null", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockResolvedValue(
				null,
			);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				"default-value",
			);

			expect(result).toBe("default-value");
		});

		it("should return default when PostHog returns undefined", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockResolvedValue(
				undefined,
			);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				"default-value",
			);

			expect(result).toBe("default-value");
		});

		it("should return default on error", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockRejectedValue(
				new Error("Network error"),
			);

			const result = await getBootstrapFlag(
				"test-flag",
				"user-123",
				"fallback",
			);

			expect(result).toBe("fallback");
		});

		it("should pass properties to getFeatureFlag", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.getFeatureFlag).mockResolvedValue(
				"value",
			);

			await getBootstrapFlag("test-flag", "user-123", "default", {
				properties: { plan: "pro" },
			});

			expect(serverFeatureFlags.getFeatureFlag).toHaveBeenCalledWith(
				"test-flag",
				"user-123",
				expect.objectContaining({
					properties: { plan: "pro" },
				}),
			);
		});
	});

	describe("isBootstrapFeatureEnabled", () => {
		it("should return default when service is disabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(false);

			const result = await isBootstrapFeatureEnabled(
				"test-flag",
				"user-123",
				true,
			);

			expect(result).toBe(true);
			expect(serverFeatureFlags.isFeatureEnabled).not.toHaveBeenCalled();
		});

		it("should return false by default when service is disabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(false);

			const result = await isBootstrapFeatureEnabled(
				"test-flag",
				"user-123",
			);

			expect(result).toBe(false);
		});

		it("should return flag value from PostHog", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.isFeatureEnabled).mockResolvedValue(
				true,
			);

			const result = await isBootstrapFeatureEnabled(
				"test-flag",
				"user-123",
			);

			expect(result).toBe(true);
		});

		it("should return false when flag is disabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.isFeatureEnabled).mockResolvedValue(
				false,
			);

			const result = await isBootstrapFeatureEnabled(
				"test-flag",
				"user-123",
			);

			expect(result).toBe(false);
		});

		it("should return default on error", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.isFeatureEnabled).mockRejectedValue(
				new Error("Network error"),
			);

			const result = await isBootstrapFeatureEnabled(
				"test-flag",
				"user-123",
				true,
			);

			expect(result).toBe(true);
		});

		it("should pass properties to isFeatureEnabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.isFeatureEnabled).mockResolvedValue(
				true,
			);

			await isBootstrapFeatureEnabled("test-flag", "user-123", false, {
				properties: { plan: "pro" },
			});

			expect(serverFeatureFlags.isFeatureEnabled).toHaveBeenCalledWith(
				"test-flag",
				"user-123",
				expect.objectContaining({
					properties: { plan: "pro" },
				}),
			);
		});

		it("should pass groups to isFeatureEnabled", async () => {
			vi.mocked(serverFeatureFlags.isEnabled).mockReturnValue(true);
			vi.mocked(serverFeatureFlags.isFeatureEnabled).mockResolvedValue(
				true,
			);

			await isBootstrapFeatureEnabled("test-flag", "user-123", false, {
				groups: { company: "acme" },
			});

			expect(serverFeatureFlags.isFeatureEnabled).toHaveBeenCalledWith(
				"test-flag",
				"user-123",
				expect.objectContaining({
					groups: { company: "acme" },
				}),
			);
		});
	});
});
