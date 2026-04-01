import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("umami analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete (window as any).umami;
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

	it("trackEvent calls window.umami.track when available", async () => {
		const umamiTrackMock = vi.fn();
		(window as any).umami = { track: umamiTrackMock };
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("click", { button: "cta" });
		expect(umamiTrackMock).toHaveBeenCalledWith("click", {
			props: { button: "cta" },
		});
	});

	it("trackEvent does nothing when window.umami is not defined", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(() => result.current.trackEvent("click")).not.toThrow();
	});
});
