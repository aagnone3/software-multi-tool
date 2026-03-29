import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditUpgradeWidget } from "./CreditUpgradeWidget";

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(),
}));

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

const mockUseCreditsBalance = vi.mocked(useCreditsBalance);
const mockUseActiveOrganization = vi.mocked(useActiveOrganization);

function makeBalance(overrides = {}) {
	return {
		included: 50,
		used: 30,
		remaining: 20,
		overage: 0,
		purchasedCredits: 0,
		totalAvailable: 20,
		periodStart: "2026-03-01",
		periodEnd: "2026-03-31",
		plan: { id: "free", name: "Free" },
		purchases: [],
		...overrides,
	};
}

function setup(balanceOverrides = {}, isFreePlan = true, isLoading = false) {
	const balance = isLoading ? undefined : makeBalance(balanceOverrides);
	const totalCredits = balance
		? balance.included + balance.purchasedCredits
		: 0;
	const percentageUsed =
		balance && totalCredits > 0
			? Math.min(100, Math.round((balance.used / totalCredits) * 100))
			: 0;

	mockUseCreditsBalance.mockReturnValue({
		balance,
		isLoading,
		isError: false,
		error: null,
		errorCode: undefined,
		isApiInitializing: false,
		totalCredits,
		percentageUsed,
		isLowCredits: false,
		isFreePlan,
		hasActiveOrganization: true,
		refetch: vi.fn(),
	} as ReturnType<typeof useCreditsBalance>);

	mockUseActiveOrganization.mockReturnValue({
		activeOrganization: {
			id: "org-1",
			slug: "my-org",
			name: "My Org",
		} as never,
		setActiveOrganization: vi.fn(),
		activeOrganizationUserRole: "member",
		isOrganizationAdmin: false,
		loaded: true,
		isOrgRoute: false,
		refetchActiveOrganization: vi.fn(),
	} as ReturnType<typeof useActiveOrganization>);
}

describe("CreditUpgradeWidget", () => {
	it("renders null while loading", () => {
		setup({}, true, true);
		const { container } = render(<CreditUpgradeWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders for free plan users with credits remaining", () => {
		setup({ used: 10, totalAvailable: 40 }, true);
		render(<CreditUpgradeWidget />);
		expect(screen.getByText("Upgrade your plan")).toBeInTheDocument();
	});

	it("renders for paid users with low credits (≤40% remaining)", () => {
		setup(
			{
				included: 500,
				used: 350,
				totalAvailable: 150,
				plan: { id: "pro", name: "Pro" },
			},
			false,
		);
		render(<CreditUpgradeWidget />);
		expect(screen.getByText("Low on credits")).toBeInTheDocument();
	});

	it("does not render for paid users with plenty of credits remaining", () => {
		setup(
			{
				included: 500,
				used: 100,
				totalAvailable: 400,
				plan: { id: "pro", name: "Pro" },
			},
			false,
		);
		const { container } = render(<CreditUpgradeWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("shows urgent state when ≤10% credits remain", () => {
		setup({ included: 100, used: 92, totalAvailable: 8 }, true);
		render(<CreditUpgradeWidget />);
		expect(screen.getByText("Running out of credits")).toBeInTheDocument();
		expect(screen.getByText("8 left")).toBeInTheDocument();
	});

	it("shows Pro plan upgrade features for free plan users", () => {
		setup({}, true);
		render(<CreditUpgradeWidget />);
		expect(
			screen.getByText("500 credits/month included"),
		).toBeInTheDocument();
		expect(screen.getByText("Priority processing")).toBeInTheDocument();
	});

	it("shows upgrade and compare plans buttons for free users", () => {
		setup({}, true);
		render(<CreditUpgradeWidget />);
		expect(
			screen.getByRole("link", { name: /upgrade to pro/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /compare plans/i }),
		).toBeInTheDocument();
	});

	it("shows only get more credits button for paid low-credit users", () => {
		setup(
			{
				included: 500,
				used: 450,
				totalAvailable: 50,
				plan: { id: "pro", name: "Pro" },
			},
			false,
		);
		render(<CreditUpgradeWidget />);
		expect(
			screen.getByRole("link", { name: /get more credits/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /compare plans/i }),
		).not.toBeInTheDocument();
	});

	it("does not render when user is in overage", () => {
		setup(
			{ included: 100, used: 110, totalAvailable: 0, overage: 10 },
			true,
		);
		const { container } = render(<CreditUpgradeWidget />);
		expect(container.firstChild).toBeNull();
	});
});
