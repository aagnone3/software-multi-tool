import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditsByToolChart } from "./CreditsByToolChart";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => ({
		enabledTools: [
			{ slug: "news-analyzer", name: "News Analyzer" },
			{ slug: "invoice-processor", name: "Invoice Processor" },
		],
	}),
}));

const mockUseUsageStats = vi.fn();
vi.mock("../../credits/hooks/use-usage-stats", () => ({
	useUsageStats: () => mockUseUsageStats(),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("CreditsByToolChart", () => {
	it("renders loading skeleton when loading", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [],
			totalUsed: 0,
			isLoading: true,
		});
		render(<CreditsByToolChart />);
		expect(screen.getByText("Credits by Tool")).toBeInTheDocument();
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders empty state when no usage data", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [],
			totalUsed: 0,
			isLoading: false,
		});
		render(<CreditsByToolChart />);
		expect(screen.getByText("No usage yet")).toBeInTheDocument();
		expect(screen.getByText("Browse tools")).toBeInTheDocument();
	});

	it("renders tool entries with credits and percentages", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [
				{ toolSlug: "news-analyzer", credits: 75, count: 5 },
				{ toolSlug: "invoice-processor", credits: 25, count: 3 },
			],
			totalUsed: 100,
			isLoading: false,
		});
		render(<CreditsByToolChart />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("75%")).toBeInTheDocument();
		expect(screen.getByText("25%")).toBeInTheDocument();
	});

	it("shows total credits in description", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [{ toolSlug: "news-analyzer", credits: 100, count: 5 }],
			totalUsed: 100,
			isLoading: false,
		});
		render(<CreditsByToolChart />);
		expect(
			screen.getByText("100 credits used this period"),
		).toBeInTheDocument();
	});

	it("falls back to slug-based name for unknown tools", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [{ toolSlug: "my-custom-tool", credits: 50, count: 2 }],
			totalUsed: 50,
			isLoading: false,
		});
		render(<CreditsByToolChart />);
		expect(screen.getByText("My Custom Tool")).toBeInTheDocument();
	});

	it("shows 'Other' bucket when tools exceed maxTools", () => {
		const byTool = Array.from({ length: 8 }, (_, i) => ({
			toolSlug: `tool-${i}`,
			credits: 10,
			count: 1,
		}));
		mockUseUsageStats.mockReturnValue({
			byTool,
			totalUsed: 80,
			isLoading: false,
		});
		render(<CreditsByToolChart maxTools={5} />);
		expect(screen.getByText("Other")).toBeInTheDocument();
	});

	it("links tools to their detail pages", () => {
		mockUseUsageStats.mockReturnValue({
			byTool: [{ toolSlug: "news-analyzer", credits: 100, count: 5 }],
			totalUsed: 100,
			isLoading: false,
		});
		render(<CreditsByToolChart />);
		const link = screen.getByRole("link", { name: "News Analyzer" });
		expect(link).toHaveAttribute("href", "/app/tools/news-analyzer");
	});
});
