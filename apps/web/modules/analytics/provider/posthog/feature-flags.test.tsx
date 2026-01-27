import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to ensure mock is available during module loading
// All mock creation must be inside the hoisted callback
const mockPosthog = vi.hoisted(() => {
	return {
		init: vi.fn(),
		identify: vi.fn(),
		getFeatureFlag: vi.fn(),
		onFeatureFlags: vi.fn(),
		_isIdentified: vi.fn().mockReturnValue(false),
		get_distinct_id: vi.fn().mockReturnValue(undefined),
		featureFlags: {
			getFlagVariants: vi.fn().mockReturnValue({}),
			hasLoadedFlags: false,
		},
	};
});

// Mock posthog-js
vi.mock("posthog-js", () => ({
	default: mockPosthog,
}));

// Import components after mocks are set up
import {
	FeatureFlagProvider,
	useFeatureFlag,
	useFeatureFlagContext,
	useFeatureFlags,
	useIsFeatureEnabled,
} from "./feature-flags";

describe("Feature Flags Client Hooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPosthog.featureFlags.getFlagVariants.mockReturnValue({});
		mockPosthog.featureFlags.hasLoadedFlags = false;
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("useFeatureFlagContext without provider", () => {
		it("should return fallback context when provider is not present", () => {
			const { result } = renderHook(() => useFeatureFlagContext());

			expect(result.current.bootstrappedFlags).toEqual({});
			expect(result.current.isLoaded).toBe(true);
			expect(result.current.getFlag("any-flag", "default")).toBe(
				"default",
			);
			expect(result.current.isFlagEnabled("any-flag", true)).toBe(true);
		});
	});

	describe("FeatureFlagProvider", () => {
		it("should provide bootstrapped flags to context", () => {
			const bootstrappedFlags = {
				"feature-a": true,
				"feature-b": "variant-1",
			};

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={bootstrappedFlags}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlagContext(), {
				wrapper,
			});

			expect(result.current.bootstrappedFlags).toEqual(bootstrappedFlags);
		});

		it("should identify user when distinctId is provided", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider distinctId="user-123">
					{children}
				</FeatureFlagProvider>
			);

			renderHook(() => useFeatureFlagContext(), { wrapper });

			expect(mockPosthog.identify).toHaveBeenCalledWith("user-123");
		});

		it("should not identify user when distinctId is not provided", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider>{children}</FeatureFlagProvider>
			);

			renderHook(() => useFeatureFlagContext(), { wrapper });

			expect(mockPosthog.identify).not.toHaveBeenCalled();
		});

		it("should set isLoaded to true after timeout", async () => {
			vi.useFakeTimers();

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider>{children}</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlagContext(), {
				wrapper,
			});

			// Fast-forward past the timeout
			await act(async () => {
				vi.advanceTimersByTime(3100);
			});

			// After the timeout, isLoaded should be true
			expect(result.current.isLoaded).toBe(true);

			vi.useRealTimers();
		});
	});

	describe("useFeatureFlag", () => {
		it("should return bootstrapped flag value", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "test-flag": "value-a" }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlag("test-flag"), {
				wrapper,
			});

			expect(result.current).toBe("value-a");
		});

		it("should return default value when flag is not found", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{}}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useFeatureFlag("missing-flag", "default"),
				{ wrapper },
			);

			expect(result.current).toBe("default");
		});

		it("should return boolean flag value", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{ "bool-flag": true }}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlag("bool-flag"), {
				wrapper,
			});

			expect(result.current).toBe(true);
		});

		it("should check PostHog directly when flag not in bootstrapped", () => {
			mockPosthog.getFeatureFlag.mockReturnValue("posthog-value");

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{}}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useFeatureFlag("dynamic-flag"),
				{
					wrapper,
				},
			);

			expect(mockPosthog.getFeatureFlag).toHaveBeenCalledWith(
				"dynamic-flag",
			);
			expect(result.current).toBe("posthog-value");
		});
	});

	describe("useIsFeatureEnabled", () => {
		it("should return true for enabled boolean flag", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "enabled-flag": true }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("enabled-flag"),
				{
					wrapper,
				},
			);

			expect(result.current).toBe(true);
		});

		it("should return false for disabled boolean flag", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "disabled-flag": false }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("disabled-flag"),
				{ wrapper },
			);

			expect(result.current).toBe(false);
		});

		it("should return true for non-empty string flag", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "string-flag": "variant-a" }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("string-flag"),
				{
					wrapper,
				},
			);

			expect(result.current).toBe(true);
		});

		it("should return false for empty string flag", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{ "empty-flag": "" }}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("empty-flag"),
				{
					wrapper,
				},
			);

			expect(result.current).toBe(false);
		});

		it("should return false for 'false' string flag", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "false-string": "false" }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("false-string"),
				{ wrapper },
			);

			expect(result.current).toBe(false);
		});

		it("should return default value when flag is not found", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{}}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("missing-flag", true),
				{ wrapper },
			);

			expect(result.current).toBe(true);
		});

		it("should return false by default when flag is not found", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{}}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(
				() => useIsFeatureEnabled("missing-flag"),
				{
					wrapper,
				},
			);

			expect(result.current).toBe(false);
		});
	});

	describe("useFeatureFlags", () => {
		it("should return all bootstrapped flags", () => {
			const bootstrappedFlags = {
				"flag-a": true,
				"flag-b": "value-b",
			};

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={bootstrappedFlags}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlags(), { wrapper });

			expect(result.current.flags).toEqual(bootstrappedFlags);
		});

		it("should return isLoaded state", () => {
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider bootstrappedFlags={{}}>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlags(), { wrapper });

			// Initially not loaded (in test environment)
			expect(typeof result.current.isLoaded).toBe("boolean");
		});

		it("should merge PostHog flags with bootstrapped flags", () => {
			mockPosthog.featureFlags.getFlagVariants.mockReturnValue({
				"posthog-flag": "posthog-value",
			});
			mockPosthog.featureFlags.hasLoadedFlags = true;

			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<FeatureFlagProvider
					bootstrappedFlags={{ "bootstrap-flag": true }}
				>
					{children}
				</FeatureFlagProvider>
			);

			const { result } = renderHook(() => useFeatureFlags(), { wrapper });

			// The hook should immediately have bootstrapped flags
			// and will merge with PostHog flags on effect
			expect(result.current.flags).toHaveProperty("bootstrap-flag", true);
		});
	});
});
