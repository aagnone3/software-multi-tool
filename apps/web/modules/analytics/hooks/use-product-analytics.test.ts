import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogCaptureMock = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
	default: {
		capture: posthogCaptureMock,
	},
}));

import { useProductAnalytics } from "./use-product-analytics";

describe("useProductAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
	});

	it("returns a track function", () => {
		const { result } = renderHook(() => useProductAnalytics());
		expect(typeof result.current.track).toBe("function");
	});

	it("captures typed event when posthog key is set", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { result } = renderHook(() => useProductAnalytics());

		result.current.track({
			name: "tool_run_started",
			props: { tool_slug: "news-analyzer", plan_id: "pro" },
		});

		expect(posthogCaptureMock).toHaveBeenCalledWith("tool_run_started", {
			tool_slug: "news-analyzer",
			plan_id: "pro",
		});
	});

	it("does not capture when posthog key is missing", () => {
		const { result } = renderHook(() => useProductAnalytics());

		result.current.track({
			name: "upgrade_cta_clicked",
			props: { source: "blog_cta", plan_id: "free" },
		});

		expect(posthogCaptureMock).not.toHaveBeenCalled();
	});

	it("captures tool_run_completed with all properties", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { result } = renderHook(() => useProductAnalytics());

		result.current.track({
			name: "tool_run_completed",
			props: {
				tool_slug: "expense-categorizer",
				plan_id: "free",
				duration_ms: 5000,
				success: true,
			},
		});

		expect(posthogCaptureMock).toHaveBeenCalledWith("tool_run_completed", {
			tool_slug: "expense-categorizer",
			plan_id: "free",
			duration_ms: 5000,
			success: true,
		});
	});

	it("captures credits_exhausted event", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { result } = renderHook(() => useProductAnalytics());

		result.current.track({
			name: "credits_exhausted",
			props: { plan_id: "free", credits_purchased: 0 },
		});

		expect(posthogCaptureMock).toHaveBeenCalledWith("credits_exhausted", {
			plan_id: "free",
			credits_purchased: 0,
		});
	});
});
