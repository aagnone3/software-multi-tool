import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseUsageStats = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: mockUseUsageStats,
}));

import { UsageSummaryCards } from "./UsageSummaryCards";

const defaultStats = {
	totalUsed: 0,
	totalOverage: 0,
	mostUsedTool: null,
	totalOperations: 0,
	isLoading: false,
};

describe("UsageSummaryCards", () => {
	it("renders loading skeletons when isLoading", () => {
		mockUseUsageStats.mockReturnValue({ ...defaultStats, isLoading: true });
		const { container } = render(<UsageSummaryCards />);
		// 4 skeleton cards
		const skeletons = container.querySelectorAll(
			"[class*='skeleton'], .animate-pulse, [data-slot='skeleton']",
		);
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders This Month credits used", () => {
		mockUseUsageStats.mockReturnValue({ ...defaultStats, totalUsed: 42 });
		render(<UsageSummaryCards />);
		expect(screen.getByText("42")).toBeDefined();
		expect(screen.getByText("credits used")).toBeDefined();
	});

	it("renders overage and calculated cost", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOverage: 50,
		});
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
		render(<UsageSummaryCards />);
		// formatToolName converts slug to display name
		expect(screen.getByText("200 credits")).toBeDefined();
	});

	it("renders dash when no most used tool", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			mostUsedTool: null,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("-")).toBeDefined();
	});

	it("renders total operations", () => {
		mockUseUsageStats.mockReturnValue({
			...defaultStats,
			totalOperations: 17,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("17")).toBeDefined();
		expect(screen.getByText("tool executions")).toBeDefined();
	});
});
