import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(),
}));
vi.mock("../../credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));
vi.mock("../../credits/hooks/use-usage-stats", () => ({
	useUsageStats: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));
vi.mock("@ui/lib", () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useCreditsBalance } from "../../credits/hooks/use-credits-balance";
import { useUsageStats } from "../../credits/hooks/use-usage-stats";
import { CreditsOverview } from "./CreditsOverview";

const mockUseActiveOrganization = vi.mocked(useActiveOrganization);
const mockUseCreditsBalance = vi.mocked(useCreditsBalance);
const mockUseUsageStats = vi.mocked(useUsageStats);

const mockBalance = {
	totalAvailable: 500,
	used: 100,
	included: 600,
	periodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
	plan: { name: "Pro" },
};

describe("CreditsOverview", () => {
	beforeEach(() => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
		} as any);
		mockUseCreditsBalance.mockReturnValue({
			balance: mockBalance,
			isLoading: false,
			percentageUsed: 17,
			isLowCredits: false,
			isStarterPlan: false,
		} as any);
		mockUseUsageStats.mockReturnValue({
			totalUsed: 100,
			isLoading: false,
		} as any);
	});

	it("renders credits info when data is available", () => {
		render(<CreditsOverview />);
		expect(screen.getByText("500")).toBeDefined();
		expect(screen.getByText("Pro plan")).toBeDefined();
		expect(screen.getByText("100")).toBeDefined(); // totalUsed
	});

	it("shows loading skeleton when loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: true,
			percentageUsed: 0,
			isLowCredits: false,
		} as any);
		render(<CreditsOverview />);
		expect(screen.getByText("Loading...")).toBeDefined();
	});

	it("shows empty state when no balance and not loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: false,
			percentageUsed: 0,
			isLowCredits: false,
		} as any);
		render(<CreditsOverview />);
		expect(screen.getByText("No credits yet")).toBeDefined();
		expect(screen.getByText("View plans")).toBeDefined();
	});

	it("shows low balance badge when credits are low", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: mockBalance,
			isLoading: false,
			percentageUsed: 90,
			isLowCredits: true,
		} as any);
		render(<CreditsOverview />);
		expect(screen.getByText("Low balance")).toBeDefined();
	});

	it("shows org billing path when org is active", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "myorg" },
		} as any);
		render(<CreditsOverview />);
		const buyLink = screen.getByText("Buy credits").closest("a");
		expect(buyLink?.getAttribute("href")).toContain("myorg");
	});

	it("shows default billing path without org", () => {
		render(<CreditsOverview />);
		const buyLink = screen.getByText("Buy credits").closest("a");
		expect(buyLink?.getAttribute("href")).toBe("/app/settings/billing");
	});

	it("shows days remaining in period", () => {
		render(<CreditsOverview />);
		expect(screen.getByText("10")).toBeDefined(); // 10 days remaining
	});

	it("shows view usage link", () => {
		render(<CreditsOverview />);
		const usageLink = screen.getByText("View usage").closest("a");
		expect(usageLink?.getAttribute("href")).toBe("/app/settings/usage");
	});

	describe("Starter plan", () => {
		beforeEach(() => {
			mockUseCreditsBalance.mockReturnValue({
				balance: { ...mockBalance, plan: { name: "Starter" } },
				isLoading: false,
				percentageUsed: 40,
				isLowCredits: false,
				isStarterPlan: true,
			} as any);
		});

		it("shows Upgrade to Pro CTA for Starter users", () => {
			render(<CreditsOverview />);
			expect(screen.getByText("Upgrade to Pro")).toBeDefined();
		});

		it("shows 5x value copy for Starter users", () => {
			render(<CreditsOverview />);
			expect(screen.getByText(/5× more/i)).toBeDefined();
		});

		it("does not show Buy credits for Starter users", () => {
			render(<CreditsOverview />);
			expect(screen.queryByText("Buy credits")).toBeNull();
		});

		it("Upgrade to Pro links to billing with upgrade param", () => {
			render(<CreditsOverview />);
			const upgradeLink = screen.getByText("Upgrade to Pro").closest("a");
			expect(upgradeLink?.getAttribute("href")).toContain("upgrade=pro");
		});
	});
});
