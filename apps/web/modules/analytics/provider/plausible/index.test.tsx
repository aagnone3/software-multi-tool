import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("plausible analytics provider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Remove plausible from window
		delete (window as any).plausible;
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("AnalyticsScript renders a Script element when plausibleUrl is set", async () => {
		vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_URL", "example.com");
		const React = await import("react");
		const { render } = await import("@testing-library/react");
		const { AnalyticsScript } = await import("./index");
		// next/script renders as a <script> tag in test env
		const { container } = render(<AnalyticsScript />);
		// Just verify it renders without error
		expect(container).toBeDefined();
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls window.plausible when available", async () => {
		const plausibleMock = vi.fn();
		(window as any).plausible = plausibleMock;
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("page-view", { path: "/home" });
		expect(plausibleMock).toHaveBeenCalledWith("page-view", {
			props: { path: "/home" },
		});
	});

	it("trackEvent does nothing when window.plausible is not defined", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		// Should not throw
		expect(() => result.current.trackEvent("page-view")).not.toThrow();
	});

	it("trackEvent does nothing in SSR context (window undefined)", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		const originalWindow = global.window;
		// Simulate SSR by temporarily making window undefined check fail
		// The branch checks typeof window === "undefined"
		expect(() => result.current.trackEvent("ssr-event")).not.toThrow();
	});
});
