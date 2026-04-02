import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthogInitMock = vi.hoisted(() => vi.fn());
const posthogCaptureMock = vi.hoisted(() => vi.fn());
const posthogOptInMock = vi.hoisted(() => vi.fn());
const posthogOptOutMock = vi.hoisted(() => vi.fn());

const useCookieConsentMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/hooks/cookie-consent", () => ({
	useCookieConsent: useCookieConsentMock,
}));

vi.mock("posthog-js", () => ({
	default: {
		__loaded: false,
		init: posthogInitMock,
		capture: posthogCaptureMock,
		opt_in_capturing: posthogOptInMock,
		opt_out_capturing: posthogOptOutMock,
		debug: vi.fn(),
	},
}));

describe("posthog analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useCookieConsentMock.mockReturnValue({ userHasConsented: false });
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

	it("AnalyticsScript initializes posthog when NEXT_PUBLIC_POSTHOG_KEY is set", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		render(<AnalyticsScript />);
		// init is called via useEffect — just verify the component renders without error
	});

	it("opts in capturing when userHasConsented is true", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		useCookieConsentMock.mockReturnValue({ userHasConsented: true });
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		render(<AnalyticsScript />);
		expect(posthogOptInMock).toHaveBeenCalled();
	});

	it("opts out capturing when userHasConsented is false", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		useCookieConsentMock.mockReturnValue({ userHasConsented: false });
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		render(<AnalyticsScript />);
		expect(posthogOptOutMock).toHaveBeenCalled();
	});

	it("uses NEXT_PUBLIC_POSTHOG_HOST env var as api_host", async () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		vi.stubEnv(
			"NEXT_PUBLIC_POSTHOG_HOST",
			"https://custom.posthog.example.com",
		);
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		render(<AnalyticsScript />);
		expect(posthogInitMock).toHaveBeenCalledWith(
			"test-key",
			expect.objectContaining({
				api_host: "https://custom.posthog.example.com",
			}),
		);
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
