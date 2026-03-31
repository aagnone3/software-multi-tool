import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { UpgradePromptBanner } from "./UpgradePromptBanner";

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
}));

import { usePurchases } from "@saas/payments/hooks/purchases";

const mockUsePurchases = vi.mocked(usePurchases);

describe("UpgradePromptBanner", () => {
	it("renders for free plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);

		expect(screen.getByText("You're on the Free plan")).toBeInTheDocument();
		expect(screen.getByText("Upgrade now")).toBeInTheDocument();
	});

	it("does not render for paid plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		const { container } = render(<UpgradePromptBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("does not render when no active plan", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: null,
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		const { container } = render(<UpgradePromptBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("shows org-scoped upgrade link", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner organizationId="org-123" />);

		const link = screen.getByRole("link", { name: /upgrade now/i });
		expect(link).toHaveAttribute(
			"href",
			"/app/orgs/org-123/settings/billing#pricing",
		);
	});

	it("shows user billing link without org", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);

		const link = screen.getByRole("link", { name: /upgrade now/i });
		expect(link).toHaveAttribute("href", "/app/settings/billing#pricing");
	});
});
