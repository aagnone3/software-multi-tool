import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsageTrendChart } from "./UsageTrendChart";

const useUsageStatsMock = vi.hoisted(() => vi.fn());
const trackMock = vi.hoisted(() => vi.fn());

vi.mock("@saas/credits/hooks/use-usage-stats", () => ({
	useUsageStats: useUsageStatsMock,
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: trackMock }),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
	AreaChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="area-chart">{children}</div>
	),
	Area: () => null,
	XAxis: () => null,
	YAxis: () => null,
	CartesianGrid: () => null,
	Tooltip: () => null,
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="responsive-container">{children}</div>
	),
}));

const now = new Date();
function daysAgo(n: number) {
	const d = new Date(now);
	d.setDate(d.getDate() - n);
	return d.toISOString().split("T")[0];
}

const sampleData = [
	{ date: daysAgo(6), credits: 10 },
	{ date: daysAgo(5), credits: 15 },
	{ date: daysAgo(4), credits: 20 },
	{ date: daysAgo(3), credits: 25 },
	{ date: daysAgo(2), credits: 30 },
	{ date: daysAgo(1), credits: 35 },
	{ date: daysAgo(0), credits: 40 },
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe("UsageTrendChart", () => {
	it("shows loading skeleton when isLoading", () => {
		useUsageStatsMock.mockReturnValue({ byPeriod: [], isLoading: true });
		render(<UsageTrendChart />);
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("shows empty state when no data", () => {
		useUsageStatsMock.mockReturnValue({ byPeriod: [], isLoading: false });
		render(<UsageTrendChart />);
		expect(
			screen.getByText("No usage data available for this period"),
		).toBeInTheDocument();
	});

	it("shows chart when data is present", () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		expect(screen.getByTestId("area-chart")).toBeInTheDocument();
	});

	it("displays total credits for period", () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		// Total = 10+15+20+25+30+35+40 = 175
		expect(screen.getByText(/175 credits used/)).toBeInTheDocument();
	});

	it("shows '7 days' text by default (week period)", () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		expect(screen.getByText(/7 days/)).toBeInTheDocument();
	});

	it("switches to month period on 30D button click", async () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		await userEvent.click(screen.getByRole("button", { name: "30D" }));
		expect(screen.getByText(/30 days/)).toBeInTheDocument();
	});

	it("switches back to week period on 7D button click", async () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		await userEvent.click(screen.getByRole("button", { name: "30D" }));
		await userEvent.click(screen.getByRole("button", { name: "7D" }));
		expect(screen.getByText(/7 days/)).toBeInTheDocument();
	});

	it("renders 'Usage Trend' title", () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		expect(screen.getByText("Usage Trend")).toBeInTheDocument();
	});

	it("tracks analytics event when switching to 30D period", async () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		await userEvent.click(screen.getByRole("button", { name: "30D" }));
		expect(trackMock).toHaveBeenCalledWith({
			name: "usage_trend_period_toggled",
			props: { period: "month" },
		});
	});

	it("tracks analytics event when switching to 7D period", async () => {
		useUsageStatsMock.mockReturnValue({
			byPeriod: sampleData,
			isLoading: false,
		});
		render(<UsageTrendChart />);
		await userEvent.click(screen.getByRole("button", { name: "30D" }));
		await userEvent.click(screen.getByRole("button", { name: "7D" }));
		expect(trackMock).toHaveBeenCalledWith({
			name: "usage_trend_period_toggled",
			props: { period: "week" },
		});
	});
});
