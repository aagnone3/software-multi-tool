import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseUsageStats = vi.fn();
vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: () => mockUseUsageStats(),
}));

vi.mock("../lib/format-tool-name", () => ({
	formatToolName: (slug: string | null) =>
		slug
			? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
			: "-",
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
	BarChart: ({ children }: { children: ReactNode }) =>
		React.createElement("div", { "data-testid": "bar-chart" }, children),
	Bar: () => null,
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

import { UsageByToolChart } from "./UsageByToolChart";

describe("UsageByToolChart", () => {
	it("shows skeleton while loading", () => {
		mockUseUsageStats.mockReturnValue({ byTool: [], isLoading: true });
		render(<UsageByToolChart />);
		expect(screen.getByTestId("skeleton")).toBeInTheDocument();
	});

	it("shows empty state when no tool data", () => {
		mockUseUsageStats.mockReturnValue({ byTool: [], isLoading: false });
		render(<UsageByToolChart />);
		expect(
			screen.getByText("No tool usage data available"),
		).toBeInTheDocument();
	});

	it("renders chart when data is present", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [
				{ toolSlug: "expense-categorizer", credits: 50, count: 5 },
				{ toolSlug: "meeting-summarizer", credits: 30, count: 3 },
			],
			isLoading: false,
		});
		render(<UsageByToolChart />);
		expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
	});

	it("renders title and description", () => {
		mockUseUsageStats.mockReturnValue({ byTool: [], isLoading: false });
		render(<UsageByToolChart />);
		expect(screen.getByText("Usage by Tool")).toBeInTheDocument();
		expect(
			screen.getByText("Credit consumption breakdown"),
		).toBeInTheDocument();
	});
});
