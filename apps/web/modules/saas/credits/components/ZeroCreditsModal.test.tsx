import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZeroCreditsModal } from "./ZeroCreditsModal";

const mockUseCreditsBalance = vi.fn();
const mockUseActiveOrganization = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("../../organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

describe("ZeroCreditsModal", () => {
	beforeEach(() => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
		});
	});

	it("does not show when credits are available", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 10 },
			isLoading: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.queryByText(/you've used all your credits/i),
		).not.toBeInTheDocument();
	});

	it("does not show while loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: true,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.queryByText(/you've used all your credits/i),
		).not.toBeInTheDocument();
	});

	it("shows when totalAvailable is 0", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "free" },
				purchasedCredits: 0,
			},
			isLoading: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.getByText(/you've used all your credits/i),
		).toBeInTheDocument();
	});

	it("shows upgrade to pro and buy credits buttons", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "free" },
				purchasedCredits: 0,
			},
			isLoading: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.getByRole("link", { name: /upgrade to pro/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /buy credits/i }),
		).toBeInTheDocument();
	});

	it("uses org-scoped billing path when org is active", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "free" },
				purchasedCredits: 0,
			},
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-org" },
		});

		render(<ZeroCreditsModal />);
		const upgradeLink = screen.getByRole("link", {
			name: /upgrade to pro/i,
		});
		expect(upgradeLink).toHaveAttribute(
			"href",
			"/app/my-org/settings/billing",
		);
	});

	it("dismisses when 'Maybe later' is clicked", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "free" },
				purchasedCredits: 0,
			},
			isLoading: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.getByText(/you've used all your credits/i),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /maybe later/i }));
		expect(
			screen.queryByText(/you've used all your credits/i),
		).not.toBeInTheDocument();
	});

	it("does not show when balance is undefined", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.queryByText(/you've used all your credits/i),
		).not.toBeInTheDocument();
	});
});

describe("ZeroCreditsModal - Starter plan", () => {
	beforeEach(() => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
		});
	});

	it("shows Starter-specific description for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "starter" },
				purchasedCredits: 0,
			},
			isLoading: false,
			isStarterPlan: true,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.getByText(/you've hit your starter credit limit/i),
		).toBeInTheDocument();
	});

	it("shows 'Compare plans' link for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "starter" },
				purchasedCredits: 0,
			},
			isLoading: false,
			isStarterPlan: true,
		});

		render(<ZeroCreditsModal />);
		const compareLink = screen.getByRole("link", {
			name: /compare plans/i,
		});
		expect(compareLink).toBeInTheDocument();
		expect(compareLink).toHaveAttribute(
			"href",
			"/pricing#pricing-plan-pro",
		);
	});

	it("does not show 'Compare plans' link for free plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "free" },
				purchasedCredits: 0,
			},
			isLoading: false,
			isStarterPlan: false,
		});

		render(<ZeroCreditsModal />);
		expect(
			screen.queryByRole("link", { name: /compare plans/i }),
		).not.toBeInTheDocument();
	});

	it("shows Pro-exclusive feature text for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				totalAvailable: 0,
				plan: { id: "starter" },
				purchasedCredits: 0,
			},
			isLoading: false,
			isStarterPlan: true,
		});

		render(<ZeroCreditsModal />);
		// The pro feature row shows "scheduled runs · bulk actions · priority processing"
		const featureEls = screen.getAllByText(/scheduled runs/i);
		expect(featureEls.length).toBeGreaterThan(0);
	});
});
