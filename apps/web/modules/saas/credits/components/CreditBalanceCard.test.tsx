import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditBalanceCard } from "./CreditBalanceCard";

const mockUseCreditsBalance = vi.fn();
const mockUseActiveOrganization = vi.fn();

vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

const baseBalance = {
	included: 1000,
	used: 250,
	remaining: 750,
	overage: 0,
	purchasedCredits: 0,
	totalAvailable: 750,
	periodStart: "2026-03-01T00:00:00Z",
	periodEnd: "2026-04-01T00:00:00Z",
	plan: { id: "pro", name: "Pro" },
	purchases: [],
};

describe("CreditBalanceCard", () => {
	it("shows loading skeleton when isLoading=true", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: true,
			totalCredits: 0,
			percentageUsed: 0,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText("Loading...")).toBeDefined();
	});

	it("returns null when balance is null and not loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: false,
			totalCredits: 0,
			percentageUsed: 0,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		const { container } = render(<CreditBalanceCard />);
		expect(container.firstChild).toBeNull();
	});

	it("renders credit balance with basic info", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: baseBalance,
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 25,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getAllByText("750").length).toBeGreaterThan(0);
		expect(screen.getByText("credits available")).toBeDefined();
		expect(screen.getByText("25%")).toBeDefined();
	});

	it("shows low balance warning when isLowCredits=true", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, totalAvailable: 50 },
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 95,
			isLowCredits: true,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText("Low balance")).toBeDefined();
	});

	it("shows purchased credits breakdown when purchasedCredits > 0", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				purchasedCredits: 200,
				remaining: 750,
			},
			isLoading: false,
			totalCredits: 1200,
			percentageUsed: 21,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText(/750 plan/)).toBeDefined();
		expect(screen.getByText(/200 purchased/)).toBeDefined();
	});

	it("shows overage warning when overage > 0", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, overage: 50 },
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 30,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText(/Overage: 50 credits/)).toBeDefined();
	});

	it("renders purchase pack list with extracted pack name", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				purchases: [
					{
						id: "p1",
						amount: 500,
						description:
							"Purchased Starter pack (500 credits) - Session: cs_abc",
						createdAt: "2026-03-10T00:00:00Z",
					},
				],
				purchasedCredits: 500,
			},
			isLoading: false,
			totalCredits: 1500,
			percentageUsed: 17,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText("Starter Pack")).toBeDefined();
		expect(screen.getByText("+500")).toBeDefined();
	});

	it("falls back to Credit Pack when description missing", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				purchases: [
					{
						id: "p2",
						amount: 100,
						description: null,
						createdAt: "2026-03-10T00:00:00Z",
					},
				],
				purchasedCredits: 100,
			},
			isLoading: false,
			totalCredits: 1100,
			percentageUsed: 23,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText("Credit Pack")).toBeDefined();
	});

	it("shows upgrade nudge when on free plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, plan: { id: "free", name: "Free" } },
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 25,
			isLowCredits: false,
			isFreePlan: true,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(screen.getByText("Upgrade for 10× more credits")).toBeDefined();
		const upgradeLink = screen.getByRole("link", {
			name: /Upgrade to Starter/i,
		});
		expect(upgradeLink.getAttribute("href")).toBe("/app/settings/billing");
	});

	it("shows low-credits nudge when isLowCredits and not free plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...baseBalance, totalAvailable: 50 },
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 95,
			isLowCredits: true,
			isFreePlan: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(
			screen.getByText("Running low — top up or upgrade"),
		).toBeDefined();
	});

	it("shows Starter→Pro nudge when on starter plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...baseBalance,
				plan: { id: "starter", name: "Starter" },
			},
			isLoading: false,
			totalCredits: 100,
			percentageUsed: 25,
			isLowCredits: false,
			isFreePlan: false,
			isStarterPlan: true,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<CreditBalanceCard />);
		expect(
			screen.getByText("Unlock Pro — more credits & power"),
		).toBeDefined();
		const upgradeLink = screen.getByRole("link", {
			name: /Upgrade to Pro/i,
		});
		expect(upgradeLink.getAttribute("href")).toBe("/app/settings/billing");
		const compareLink = screen.getByRole("link", {
			name: /Compare plans/i,
		});
		expect(compareLink.getAttribute("href")).toBe(
			"/pricing#pricing-plan-pro",
		);
	});

	it("uses org usage history path when activeOrganization exists", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: baseBalance,
			isLoading: false,
			totalCredits: 1000,
			percentageUsed: 25,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "acme" },
		});
		render(<CreditBalanceCard />);
		const link = screen.getByRole("link", { name: /View usage history/i });
		expect(link.getAttribute("href")).toBe("/app/acme/settings/usage");
	});
});
