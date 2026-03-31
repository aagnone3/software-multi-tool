import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpgradePromptBanner } from "./UpgradePromptBanner";

const mockTrack = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
}));

import { usePurchases } from "@saas/payments/hooks/purchases";

const mockUsePurchases = vi.mocked(usePurchases);

describe("UpgradePromptBanner", () => {
	beforeEach(() => {
		mockTrack.mockReset();
	});
	it("renders for free plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);

		expect(screen.getByText("You're on the Free plan")).toBeInTheDocument();
		expect(screen.getByText("Upgrade now")).toBeInTheDocument();
	});

	it("renders Starter-to-Pro prompt for starter plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);
		expect(
			screen.getByText("You're on the Starter plan"),
		).toBeInTheDocument();
		expect(screen.getByText("Unlock Pro")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /compare plans/i }),
		).toHaveAttribute("href", "/app/settings/billing#pricing-plan-pro");
	});

	it("does not render for pro plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro" },
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

	it("tracks starter compare-plans CTA with dedicated analytics source", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);
		fireEvent.click(screen.getByRole("link", { name: /compare plans/i }));

		expect(mockTrack).toHaveBeenCalledWith({
			name: "upgrade_cta_clicked",
			props: {
				source: "starter_to_pro_compare_plans_banner",
				plan_id: "starter",
				target_plan: "pro",
			},
		});
	});

	it("tracks starter upgrade CTA with starter-specific source", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
			purchases: [],
		} as unknown as ReturnType<typeof usePurchases>);

		render(<UpgradePromptBanner />);
		fireEvent.click(screen.getByRole("link", { name: /unlock pro/i }));

		expect(mockTrack).toHaveBeenCalledWith({
			name: "upgrade_cta_clicked",
			props: {
				source: "starter_to_pro_upgrade_banner",
				plan_id: "starter",
				target_plan: "pro",
			},
		});
	});
});
