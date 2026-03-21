import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const trackMock = vi.hoisted(() => vi.fn());
const initMock = vi.hoisted(() => vi.fn());

vi.mock("mixpanel-browser", () => ({
	default: {
		init: initMock,
		track: trackMock,
	},
}));

import { useAnalytics } from "./index";

describe("useAnalytics (mixpanel)", () => {
	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("calls mixpanel.track with event and data", () => {
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { foo: "bar" });
		expect(trackMock).toHaveBeenCalledWith("test-event", { foo: "bar" });
	});

	it("calls mixpanel.track without data", () => {
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("bare-event");
		expect(trackMock).toHaveBeenCalledWith("bare-event", undefined);
	});
});
