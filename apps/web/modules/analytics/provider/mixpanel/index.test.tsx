import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mixpanelInitMock = vi.hoisted(() => vi.fn());
const mixpanelTrackMock = vi.hoisted(() => vi.fn());

vi.mock("mixpanel-browser", () => ({
	default: {
		init: mixpanelInitMock,
		track: mixpanelTrackMock,
	},
}));

describe("mixpanel analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("AnalyticsScript renders null", async () => {
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		const { container } = render(<AnalyticsScript />);
		expect(container.firstChild).toBeNull();
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls mixpanel.track with event and data", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("purchase", { plan: "pro", amount: 29 });
		expect(mixpanelTrackMock).toHaveBeenCalledWith("purchase", {
			plan: "pro",
			amount: 29,
		});
	});
});
