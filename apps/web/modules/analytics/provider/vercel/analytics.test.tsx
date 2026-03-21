import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const trackMock = vi.hoisted(() => vi.fn());

vi.mock("@vercel/analytics", () => ({
	track: trackMock,
}));

vi.mock("@vercel/analytics/react", () => ({
	Analytics: () => null,
}));

import { useAnalytics } from "./index";

describe("useAnalytics (vercel)", () => {
	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("calls track with event and data", () => {
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("my-event", { key: "val" });
		expect(trackMock).toHaveBeenCalledWith("my-event", { key: "val" });
	});

	it("calls track without data", () => {
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("bare-event");
		expect(trackMock).toHaveBeenCalledWith("bare-event", undefined);
	});
});
