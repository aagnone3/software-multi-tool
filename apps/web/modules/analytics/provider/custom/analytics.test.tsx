import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./index";

describe("custom useAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("calls console.info when trackEvent is called", () => {
		const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { foo: "bar" });
		expect(consoleSpy).toHaveBeenCalledWith("tracking event", "test-event", { foo: "bar" });
		consoleSpy.mockRestore();
	});

	it("does not throw when called without data", () => {
		const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
		const { result } = renderHook(() => useAnalytics());
		// @ts-expect-error - testing missing data arg
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
		consoleSpy.mockRestore();
	});
});
