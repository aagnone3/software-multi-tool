import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BlogStickyCta } from "./BlogStickyCta";

// ---- module mocks ----
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));

// Mock StickyCta so we can assert presence/absence without its own dependencies
vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";

const mockUseCreditsBalance = useCreditsBalance as ReturnType<typeof vi.fn>;

describe("BlogStickyCta", () => {
	it("renders StickyCta for anonymous users (no balance data)", () => {
		// Query disabled for anonymous users → balance undefined, isLoading false
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isFreePlan: false,
			isLoading: false,
		});

		const { getByTestId } = render(<BlogStickyCta />);
		expect(getByTestId("sticky-cta")).toBeTruthy();
	});

	it("renders StickyCta for free-plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { plan: { id: "free", name: "Free" } },
			isFreePlan: true,
			isLoading: false,
		});

		const { getByTestId } = render(<BlogStickyCta />);
		expect(getByTestId("sticky-cta")).toBeTruthy();
	});

	it("does NOT render StickyCta for Pro users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { plan: { id: "pro", name: "Pro" } },
			isFreePlan: false,
			isLoading: false,
		});

		const { queryByTestId } = render(<BlogStickyCta />);
		expect(queryByTestId("sticky-cta")).toBeNull();
	});

	it("renders StickyCta while loading (avoids CTA flash for Pro on hydration)", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isFreePlan: false,
			isLoading: true,
		});

		const { getByTestId } = render(<BlogStickyCta />);
		// During loading we cannot confirm Pro, so show CTA (acceptable trade-off)
		expect(getByTestId("sticky-cta")).toBeTruthy();
	});
});
