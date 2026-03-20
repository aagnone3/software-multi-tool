import { renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	FeatureFlagProvider,
	useFeatureFlag,
	useFeatureFlagContext,
	useFeatureFlags,
	useIsFeatureEnabled,
} from "./feature-flags";

// Mock posthog-js
vi.mock("posthog-js", () => ({
	default: {
		onFeatureFlags: vi.fn(),
		identify: vi.fn(),
		getFeatureFlag: vi.fn(),
		featureFlags: {
			hasLoadedFlags: false,
			getFlagVariants: vi.fn(() => ({})),
		},
	},
}));

function wrapper(
	bootstrappedFlags: Record<string, boolean | string | undefined> = {},
) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<FeatureFlagProvider bootstrappedFlags={bootstrappedFlags}>
				{children}
			</FeatureFlagProvider>
		);
	};
}

describe("useFeatureFlagContext", () => {
	it("returns fallback when not inside provider", () => {
		const { result } = renderHook(() => useFeatureFlagContext());
		expect(result.current.isLoaded).toBe(true);
		expect(result.current.bootstrappedFlags).toEqual({});
		expect(result.current.getFlag("any-key", "default")).toBe("default");
		expect(result.current.isFlagEnabled("any-key")).toBe(false);
	});

	it("returns context values when inside provider", () => {
		const flags = { "my-flag": true };
		const { result } = renderHook(() => useFeatureFlagContext(), {
			wrapper: wrapper(flags),
		});
		expect(result.current.bootstrappedFlags).toEqual(flags);
	});
});

describe("useFeatureFlag", () => {
	it("returns bootstrapped flag value", () => {
		const { result } = renderHook(() => useFeatureFlag("my-flag"), {
			wrapper: wrapper({ "my-flag": "variant-a" }),
		});
		expect(result.current).toBe("variant-a");
	});

	it("returns defaultValue when flag not found", () => {
		const { result } = renderHook(
			() => useFeatureFlag("missing-flag", "fallback"),
			{
				wrapper: wrapper({}),
			},
		);
		expect(result.current).toBe("fallback");
	});

	it("returns undefined when flag not found and no default", () => {
		const { result } = renderHook(() => useFeatureFlag("missing-flag"), {
			wrapper: wrapper({}),
		});
		expect(result.current).toBeUndefined();
	});
});

describe("useIsFeatureEnabled", () => {
	it("returns true for boolean true flag", () => {
		const { result } = renderHook(
			() => useIsFeatureEnabled("enabled-flag"),
			{
				wrapper: wrapper({ "enabled-flag": true }),
			},
		);
		expect(result.current).toBe(true);
	});

	it("returns false for boolean false flag", () => {
		const { result } = renderHook(
			() => useIsFeatureEnabled("disabled-flag"),
			{
				wrapper: wrapper({ "disabled-flag": false }),
			},
		);
		expect(result.current).toBe(false);
	});

	it("returns true for non-empty non-false string flag", () => {
		const { result } = renderHook(() => useIsFeatureEnabled("str-flag"), {
			wrapper: wrapper({ "str-flag": "variant" }),
		});
		expect(result.current).toBe(true);
	});

	it("returns false for 'false' string flag", () => {
		const { result } = renderHook(() => useIsFeatureEnabled("str-flag"), {
			wrapper: wrapper({ "str-flag": "false" }),
		});
		expect(result.current).toBe(false);
	});

	it("returns defaultValue when flag is missing", () => {
		const { result } = renderHook(
			() => useIsFeatureEnabled("missing", true),
			{
				wrapper: wrapper({}),
			},
		);
		expect(result.current).toBe(true);
	});

	it("returns false by default for missing flag", () => {
		const { result } = renderHook(() => useIsFeatureEnabled("missing"), {
			wrapper: wrapper({}),
		});
		expect(result.current).toBe(false);
	});
});

describe("useFeatureFlags", () => {
	it("returns bootstrapped flags and isLoaded state", () => {
		const flags = { "flag-a": true, "flag-b": "value" };
		const { result } = renderHook(() => useFeatureFlags(), {
			wrapper: wrapper(flags),
		});
		expect(result.current.flags).toEqual(flags);
		expect(typeof result.current.isLoaded).toBe("boolean");
	});

	it("returns empty flags when no bootstrapped flags", () => {
		const { result } = renderHook(() => useFeatureFlags(), {
			wrapper: wrapper(),
		});
		expect(result.current.flags).toEqual({});
	});
});
