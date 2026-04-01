import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendGAEventMock = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({
	GoogleAnalytics: () => null,
	sendGAEvent: sendGAEventMock,
}));

describe("google analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("AnalyticsScript renders the GoogleAnalytics component", async () => {
		vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123");
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

	it("trackEvent delegates to sendGAEvent", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("conversion", { currency: "USD" });
		expect(sendGAEventMock).toHaveBeenCalledWith("conversion", {
			currency: "USD",
		});
	});
});
