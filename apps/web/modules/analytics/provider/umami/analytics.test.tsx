import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./index";

describe("umami useAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Remove umami from window
		delete (window as any).umami;
	});

	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("does not throw when window.umami is not defined", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(() =>
			result.current.trackEvent("test-event", { foo: "bar" }),
		).not.toThrow();
	});

	it("does not throw when called without data", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
	});

	it("calls window.umami.track when available", () => {
		const trackMock = vi.fn();
		(window as any).umami = { track: trackMock };

		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { key: "value" });

		expect(trackMock).toHaveBeenCalledWith("test-event", {
			props: { key: "value" },
		});
	});
});
