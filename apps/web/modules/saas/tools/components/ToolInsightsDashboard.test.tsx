import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolInsightsDashboard } from "./ToolInsightsDashboard";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					creditCost: 5,
					enabled: true,
					comingSoon: false,
				},
				{
					slug: "expense-categorizer",
					name: "Expense Categorizer",
					creditCost: 3,
					enabled: true,
					comingSoon: false,
				},
			],
		},
	},
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

import { useJobsList } from "@tools/hooks/use-job-polling";

const mockUseJobsList = vi.mocked(useJobsList);

describe("ToolInsightsDashboard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading skeletons while loading", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		} as any);

		const { container } = render(<ToolInsightsDashboard />);
		expect(
			container.querySelectorAll('[class*="animate"]').length,
		).toBeGreaterThan(0);
	});

	it("shows empty state when no jobs", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		render(<ToolInsightsDashboard />);
		expect(screen.getByText(/no tool usage yet/i)).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /browse tools/i }),
		).toHaveAttribute("href", "/app/tools");
	});

	it("renders table with tool rows", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 5000).toISOString(),
					completedAt: new Date(Date.now() - 2000).toISOString(),
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "FAILED",
					createdAt: new Date(Date.now() - 10000).toISOString(),
					completedAt: null,
				},
				{
					id: "3",
					toolSlug: "expense-categorizer",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 8000).toISOString(),
					completedAt: new Date(Date.now() - 5000).toISOString(),
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		render(<ToolInsightsDashboard />);
		expect(
			screen.getByRole("link", { name: "News Analyzer" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Expense Categorizer" }),
		).toBeInTheDocument();
	});

	it("sorts by most runs first", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "expense-categorizer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
				{
					id: "3",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		render(<ToolInsightsDashboard />);
		const rows = screen
			.getAllByRole("link")
			.filter(
				(el) =>
					el.getAttribute("href")?.startsWith("/app/tools/news") ||
					el.getAttribute("href")?.startsWith("/app/tools/expense"),
			);
		expect(rows[0]).toHaveTextContent("News Analyzer");
		expect(rows[1]).toHaveTextContent("Expense Categorizer");
	});

	it("shows success rate badge", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "FAILED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: null,
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		render(<ToolInsightsDashboard />);
		expect(screen.getByText("50%")).toBeInTheDocument();
	});

	it("shows credits used for completed jobs", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01T00:00:00Z",
					completedAt: "2026-01-01T00:00:05Z",
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);

		render(<ToolInsightsDashboard />);
		// 2 completed × 5 credits = 10
		expect(screen.getByText("10")).toBeInTheDocument();
	});
});

describe("ToolInsightsDashboard – analytics", () => {
	beforeEach(() => {
		mockTrack.mockClear();
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);
	});

	it("fires tool_insights_page_viewed on mount", () => {
		render(<ToolInsightsDashboard />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_insights_page_viewed",
			props: {},
		});
	});
});
