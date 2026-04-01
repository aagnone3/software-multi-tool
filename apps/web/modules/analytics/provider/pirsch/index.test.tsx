import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("pirsch analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete (window as any).pirsch;
	});

	it("AnalyticsScript renders a Script element", async () => {
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		const { container } = render(<AnalyticsScript />);
		expect(container).toBeDefined();
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
		result.current.trackEvent("signup", { plan: "pro" });
		expect(pirschMock).toHaveBeenCalledWith("signup", {
			meta: { plan: "pro" },
		});
	});

	it("trackEvent does nothing when window.pirsch is not defined", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("signup")).not.toThrow();
	});
});
