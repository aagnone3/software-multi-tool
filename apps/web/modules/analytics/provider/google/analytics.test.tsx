import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const sendGAEventMock = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({
	GoogleAnalytics: () => null,
	sendGAEvent: sendGAEventMock,
}));

import { useAnalytics } from "./index";

describe("useAnalytics (google)", () => {
	it("returns a trackEvent function", () => {
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent is sendGAEvent", () => {
		const { result } = renderHook(() => useAnalytics());
		// trackEvent is directly assigned to sendGAEvent
		expect(result.current.trackEvent).toBe(sendGAEventMock);
	});
});
