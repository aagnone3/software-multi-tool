import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseUsageStats = vi.fn();
vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: () => mockUseUsageStats(),
}));

vi.mock("../lib/format-tool-name", () => ({
	formatToolName: (slug: string) =>
		slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

vi.mock("@ui/components/card", () => {
	const React = require("react");
	return {
		Card: ({ children }: { children: ReactNode }) =>
			React.createElement("div", { "data-testid": "card" }, children),
		CardHeader: ({ children }: { children: ReactNode }) =>
			React.createElement("div", null, children),
		CardContent: ({ children }: { children: ReactNode }) =>
			React.createElement("div", null, children),
		CardTitle: ({ children }: { children: ReactNode }) =>
			React.createElement("span", null, children),
	};
});

vi.mock("@ui/components/skeleton", () => {
	const React = require("react");
	return {
		Skeleton: () =>
			React.createElement("div", { "data-testid": "skeleton" }),
	};
});

import { UsageSummaryCards } from "./UsageSummaryCards";

describe("UsageSummaryCards", () => {
	it("renders skeletons while loading", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: true,
			totalUsed: 0,
			totalOverage: 0,
			mostUsedTool: null,
			totalOperations: 0,
		});
		render(<UsageSummaryCards />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders four stat cards when loaded", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: false,
			totalUsed: 120,
			totalOverage: 5,
			mostUsedTool: { toolSlug: "meeting-summarizer", credits: 30 },
			totalOperations: 15,
		});
		render(<UsageSummaryCards />);
		const cards = screen.getAllByTestId("card");
		expect(cards).toHaveLength(4);
	});

	it("displays totalUsed value", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: false,
			totalUsed: 88,
			totalOverage: 0,
			mostUsedTool: null,
			totalOperations: 10,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("88")).toBeTruthy();
	});

	it("displays formatted mostUsedTool name", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: false,
			totalUsed: 10,
			totalOverage: 0,
			mostUsedTool: { toolSlug: "invoice-processor", credits: 20 },
			totalOperations: 5,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("Invoice Processor")).toBeTruthy();
	});

	it("shows dash when no mostUsedTool", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: false,
			totalUsed: 0,
			totalOverage: 0,
			mostUsedTool: null,
			totalOperations: 0,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("-")).toBeTruthy();
	});

	it("calculates overage cost correctly", () => {
		mockUseUsageStats.mockReturnValue({
			isLoading: false,
			totalUsed: 10,
			totalOverage: 100,
			mostUsedTool: null,
			totalOperations: 5,
		});
		render(<UsageSummaryCards />);
		expect(screen.getByText("$2.00 charged")).toBeTruthy();
	});
});
