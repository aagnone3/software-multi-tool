import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("pirsch analytics", () => {
	beforeEach(() => {
		vi.resetModules();
		(window as any).pirsch = undefined;
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls window.pirsch when available", async () => {
		const pirschMock = vi.fn();
		(window as any).pirsch = pirschMock;
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { key: "value" });
		expect(pirschMock).toHaveBeenCalledWith("test-event", {
			meta: { key: "value" },
		});
	});

	it("trackEvent does not throw when window.pirsch is missing", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
	});
});
