import { render, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@testing-library/react", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@testing-library/react")>();
	return actual;
});

describe("custom analytics provider", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("AnalyticsScript renders null", async () => {
		const { AnalyticsScript } = await import("./index");
		const { container } = render(<AnalyticsScript />);
		expect(container.firstChild).toBeNull();
	});

	it("useAnalytics returns a trackEvent function", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		expect(typeof result.current.trackEvent).toBe("function");
	});

	it("trackEvent calls console.info with event and data", async () => {
		const { useAnalytics } = await import("./index");
		const { result } = renderHook(() => useAnalytics());
		result.current.trackEvent("test-event", { foo: "bar" });
		expect(consoleSpy).toHaveBeenCalledWith(
			"tracking event",
			"test-event",
			{
				foo: "bar",
			},
		);
	});
});
