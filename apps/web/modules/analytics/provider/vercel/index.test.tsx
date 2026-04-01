import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const vercelTrackMock = vi.hoisted(() => vi.fn());
const AnalyticsMock = vi.hoisted(() => () => null);

vi.mock("@vercel/analytics", () => ({
	track: vercelTrackMock,
}));

vi.mock("@vercel/analytics/react", () => ({
	Analytics: AnalyticsMock,
}));

describe("vercel analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("AnalyticsScript renders the Analytics component", async () => {
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

	it("trackEvent delegates to vercel track", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("pageview", { page: "/pricing" });
		expect(vercelTrackMock).toHaveBeenCalledWith("pageview", {
			page: "/pricing",
		});
	});
});
