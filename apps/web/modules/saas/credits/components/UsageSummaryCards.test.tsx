import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseUsageStats = vi.hoisted(() => vi.fn());
const mockUseCreditsBalance = vi.hoisted(() => vi.fn());
const mockTrack = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: mockUseUsageStats,
}));

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: mockUseCreditsBalance,
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { UsageSummaryCards } from "./UsageSummaryCards";

const defaultStats = {
	totalUsed: 0,
	totalOverage: 0,
	mostUsedTool: null,
	totalOperations: 0,
	isLoading: false,
};

const defaultBalance = {
	isStarterPlan: false,
	isFreePlan: false,
};

describe("UsageSummaryCards", () => {
	it("renders loading skeletons when isLoading", () => {
		mockUseUsageStats.mockReturnValue({ ...defaultStats, isLoading: true });
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		const { container } = render(<UsageSummaryCards />);
		const skeletons = container.querySelectorAll(
			"[class*='skeleton'], .animate-pulse, [data-slot='skeleton']",
		);
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders This Month credits used", () => {
		mockUseUsageStats.mockReturnValue({ ...defaultStats, totalUsed: 42 });
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		render(<UsageSummaryCards />);
		expect(screen.getByText("42")).toBeDefined();
		expect(screen.getByText("credits used")).toBeDefined();
	});

	it("renders overage and calculated cost", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 50,
		});
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		render(<UsageSummaryCards />);
		expect(screen.getByText("50")).toBeDefined();
		// $50 * 0.02 = $1.00
		expect(screen.getByText("$1.00 charged")).toBeDefined();
	});

	it("renders most used tool name when present", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			mostUsedTool: { toolSlug: "meeting-summarizer", credits: 200 },
		});
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		render(<UsageSummaryCards />);
		expect(screen.getByText("200 credits")).toBeDefined();
	});

	it("renders dash when no most used tool", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			mostUsedTool: null,
		});
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		render(<UsageSummaryCards />);
		expect(screen.getByText("-")).toBeDefined();
	});

	it("renders total operations", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOperations: 17,
		});
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		render(<UsageSummaryCards />);
		expect(screen.getByText("17")).toBeDefined();
		expect(screen.getByText("tool executions")).toBeDefined();
	});

	it("shows overage upgrade nudge for Starter users with overage", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 20,
		});
		mockUseCreditsBalance.mockReturnValue({
			isStarterPlan: true,
			isFreePlan: false,
		});
		render(<UsageSummaryCards />);
		expect(
			screen.getByText(/You paid \$0\.40 in overage this month/),
		).toBeDefined();
		expect(screen.getByText("Upgrade to Pro")).toBeDefined();
		expect(screen.getByText("Compare plans")).toBeDefined();
	});

	it("shows overage upgrade nudge for Free users with overage", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 5,
		});
		mockUseCreditsBalance.mockReturnValue({
			isStarterPlan: false,
			isFreePlan: true,
		});
		render(<UsageSummaryCards />);
		expect(
			screen.getByText(/You paid \$0\.10 in overage this month/),
		).toBeDefined();
	});

	it("does not show overage nudge for Pro users", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 10,
		});
		mockUseCreditsBalance.mockReturnValue({
			isStarterPlan: false,
			isFreePlan: false,
		});
		render(<UsageSummaryCards />);
		expect(screen.queryByText("Upgrade to Pro")).toBeNull();
	});

	it("does not show overage nudge when there is no overage", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 0,
		});
		mockUseCreditsBalance.mockReturnValue({
			isStarterPlan: true,
			isFreePlan: false,
		});
		render(<UsageSummaryCards />);
		expect(screen.queryByText("Upgrade to Pro")).toBeNull();
	});
});
