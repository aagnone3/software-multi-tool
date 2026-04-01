import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditBalanceSection } from "./CreditBalanceSection";

// Mock sub-components to isolate CreditBalanceSection behaviour
vi.mock("./CreditBalanceCard", () => ({
	CreditBalanceCard: () => <div data-testid="credit-balance-card" />,
}));

vi.mock("@saas/shared/components/EmptyStateUpgradeNudge", () => ({
	EmptyStateUpgradeNudge: ({ context }: { context: string }) => (
		<div data-testid="empty-state-nudge" data-context={context} />
	),
}));

const mockUseCreditsBalance = vi.fn();
vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

const baseBalance = {
	included: 10,
	used: 10,
	remaining: 0,
	overage: 0,
	purchasedCredits: 0,
	totalAvailable: 0,
	periodStart: "2026-03-01T00:00:00Z",
	periodEnd: "2026-04-01T00:00:00Z",
	plan: { id: "free", name: "Free" },
	purchases: [],
};

describe("CreditBalanceSection", () => {
	it("always renders CreditBalanceCard", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: baseBalance,
			isLoading: false,
			isFreePlan: true,
		});
		render(<CreditBalanceSection />);
		expect(screen.getByTestId("credit-balance-card")).toBeDefined();
	});

	it("shows EmptyStateUpgradeNudge with context=credits when free user has zero credits", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: baseBalance,
			isLoading: false,
			isFreePlan: true,
		});
		render(<CreditBalanceSection />);
		const nudge = screen.getByTestId("empty-state-nudge");
		expect(nudge).toBeDefined();
		expect(nudge.getAttribute("data-context")).toBe("credits");
	});

	it("does NOT show nudge when credits remain", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, totalAvailable: 5 },
			isLoading: false,
			isFreePlan: true,
		});
		render(<CreditBalanceSection />);
		expect(screen.queryByTestId("empty-state-nudge")).toBeNull();
	});

	it("does NOT show nudge when paid user has zero credits", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, plan: { id: "pro", name: "Pro" } },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: false,
		});
		render(<CreditBalanceSection />);
		expect(screen.queryByTestId("empty-state-nudge")).toBeNull();
	});

	it("shows EmptyStateUpgradeNudge for Starter user with zero credits", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				plan: { id: "starter", name: "Starter" },
			},
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<CreditBalanceSection />);
		const nudge = screen.getByTestId("empty-state-nudge");
		expect(nudge).toBeDefined();
		expect(nudge.getAttribute("data-context")).toBe("credits");
	});

	it("does NOT show nudge for Starter user with remaining credits", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				totalAvailable: 10,
				plan: { id: "starter", name: "Starter" },
			},
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<CreditBalanceSection />);
		expect(screen.queryByTestId("empty-state-nudge")).toBeNull();
	});

	it("does NOT show nudge while loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: true,
			isFreePlan: false,
		});
		render(<CreditBalanceSection />);
		expect(screen.queryByTestId("empty-state-nudge")).toBeNull();
	});
});
