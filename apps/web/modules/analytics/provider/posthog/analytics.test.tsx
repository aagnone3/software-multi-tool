import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogInitMock = vi.hoisted(() => vi.fn());
const posthogCaptureMock = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
	default: {
		init: posthogInitMock,
		capture: posthogCaptureMock,
	},
}));

import { useAnalytics } from "./index";

describe("useAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		// Stub key to empty by default so tests that expect no-key behavior work
		// even when .env/.env.local has the key set.
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
	});

	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("captures event when posthog key is set", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { foo: "bar" });
		expect(posthogCaptureMock).toHaveBeenCalledWith("test-event", {
			foo: "bar",
		});
	});

	it("does not capture event when posthog key is undefined", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
		expect(posthogCaptureMock).not.toHaveBeenCalled();
	});

	it("captures event without data when data is omitted", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("no-data-event");
		expect(posthogCaptureMock).toHaveBeenCalledWith(
			"no-data-event",
			undefined,
		);
	});
});
