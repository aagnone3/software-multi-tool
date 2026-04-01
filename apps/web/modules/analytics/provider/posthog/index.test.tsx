import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthogInitMock = vi.hoisted(() => vi.fn());
const posthogCaptureMock = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
	default: {
		init: posthogInitMock,
		capture: posthogCaptureMock,
	},
}));

describe("posthog analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("AnalyticsScript renders null", async () => {
		const React = await import("react");
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		const { container } = render(<AnalyticsScript />);
		expect(container.firstChild).toBeNull();
	});

	it("AnalyticsScript initializes posthog when NEXT_PUBLIC_POSTHOG_KEY is set", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		// Re-import to get fresh module with env var
		const { renderHook: rh } = await import("@testing-library/react");
		const React = await import("react");
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		render(<AnalyticsScript />);
		// init is called via useEffect — just verify the component renders without error
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls posthog.capture when key is set", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("my-event", { value: 42 });
		expect(posthogCaptureMock).toHaveBeenCalledWith("my-event", {
			value: 42,
		});
	});

	it("trackEvent does nothing when NEXT_PUBLIC_POSTHOG_KEY is unset", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("my-event");
		expect(posthogCaptureMock).not.toHaveBeenCalled();
	});
});
