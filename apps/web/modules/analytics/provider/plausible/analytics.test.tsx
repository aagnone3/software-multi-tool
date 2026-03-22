import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("plausible analytics", () => {
	beforeEach(() => {
		vi.resetModules();
		// clear window.plausible between tests
		(window as any).plausible = undefined;
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls window.plausible when available", async () => {
		const plausibleMock = vi.fn();
		(window as any).plausible = plausibleMock;
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { key: "value" });
		expect(plausibleMock).toHaveBeenCalledWith("test-event", {
			props: { key: "value" },
		});
	});

	it("trackEvent does not throw when window.plausible is missing", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("test-event")).not.toThrow();
	});
});
