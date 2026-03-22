import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseUsageStats = vi.fn();
vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: () => mockUseUsageStats(),
}));

vi.mock("@ui/components/card", () => {
	const React = require("react");
	return {
		Card: ({
			children,
			className,
		}: {
			children: ReactNode;
			className?: string;
		}) =>
			React.createElement(
				"div",
				{ "data-testid": "card", className },
				children,
			),
		CardHeader: ({ children }: { children: ReactNode }) =>
			React.createElement("div", null, children),
		CardContent: ({ children }: { children: ReactNode }) =>
			React.createElement("div", null, children),
		CardTitle: ({ children }: { children: ReactNode }) =>
			React.createElement("span", null, children),
		CardDescription: ({ children }: { children: ReactNode }) =>
			React.createElement("p", null, children),
	};
});

vi.mock("@ui/components/skeleton", () => {
	const React = require("react");
	return {
		Skeleton: ({ className }: { className?: string }) =>
			React.createElement("div", {
				"data-testid": "skeleton",
				className,
			}),
	};
});

vi.mock("recharts", () => ({
	LineChart: ({ children }: { children: ReactNode }) =>
		React.createElement("div", { "data-testid": "line-chart" }, children),
	Line: () => null,
	XAxis: () => null,
	YAxis: () => null,
	CartesianGrid: () => null,
	Tooltip: () => null,
	ResponsiveContainer: ({ children }: { children: ReactNode }) =>
		React.createElement(
			"div",
			{ "data-testid": "recharts-container" },
			children,
		),
}));

import { UsageChart } from "./UsageChart";

describe("UsageChart", () => {
	it("shows skeleton while loading", () => {
		mockUseUsageStats.mockReturnValue({ byPeriod: [], isLoading: true });
		render(<UsageChart />);
		expect(screen.getByTestId("skeleton")).toBeInTheDocument();
	});

	it("shows empty state when no period data", () => {
		mockUseUsageStats.mockReturnValue({ byPeriod: [], isLoading: false });
		render(<UsageChart />);
		expect(
			screen.getByText("No usage data available for this period"),
		).toBeInTheDocument();
	});

	it("renders chart when data is present", () => {
		mockUseUsageStats.mockReturnValue({
			byPeriod: [
				{ date: "2026-03-01", credits: 10 },
				{ date: "2026-03-02", credits: 25 },
			],
			isLoading: false,
		});
		render(<UsageChart />);
		expect(screen.getByTestId("line-chart")).toBeInTheDocument();
	});

	it("renders title and description", () => {
		mockUseUsageStats.mockReturnValue({ byPeriod: [], isLoading: false });
		render(<UsageChart />);
		expect(screen.getByText("Daily Usage")).toBeInTheDocument();
		expect(
			screen.getByText("Credits consumed per day"),
		).toBeInTheDocument();
	});
});
