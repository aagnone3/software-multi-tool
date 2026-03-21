import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./index";

describe("pirsch useAnalytics", () => {
	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("does not throw when window.pirsch is not defined", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(() =>
			result.current.trackEvent("test-event", { foo: "bar" }),
		).not.toThrow();
	});

	it("does not throw when called without data", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
	});

	it("calls window.pirsch with event and meta when available", () => {
		const trackMock = vi.fn();
		(window as any).pirsch = trackMock;
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { key: "value" });
		expect(trackMock).toHaveBeenCalledWith("test-event", {
			meta: { key: "value" },
		});
		delete (window as any).pirsch;
	});
});
