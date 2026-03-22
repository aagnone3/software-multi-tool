import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { useRecentJobs } from "../hooks/use-recent-jobs";
import { TopToolsWidget } from "./TopToolsWidget";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: vi.fn(() => ({
		enabledTools: [
			{
				slug: "news-analyzer",
				name: "News Analyzer",
				enabled: true,
				isComingSoon: false,
				creditCost: 1,
				public: false,
				icon: "newspaper",
				description: "Analyze news",
			},
			{
				slug: "invoice-processor",
				name: "Invoice Processor",
				enabled: true,
				isComingSoon: false,
				creditCost: 2,
				public: false,
				icon: "file",
				description: "Process invoices",
			},
		],
	})),
}));

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(() => ({
		jobs: [],
		isLoading: false,
		isError: false,
		recentToolSlugs: [],
		recentToolsMap: new Map(),
		error: null,
		refetch: vi.fn(),
	})),
}));

const mockUseRecentJobs = vi.mocked(useRecentJobs);

describe("TopToolsWidget", () => {
	it("renders loading skeleton", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: true,
			isError: false,
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget />);
		expect(screen.getByText("Top Tools")).toBeInTheDocument();
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders empty state when no jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
			isError: false,
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget />);
		expect(screen.getByText("No usage yet")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Browse tools/i }),
		).toHaveAttribute("href", "/app/tools");
	});

	it("renders top tools with run counts", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01",
					completedAt: null,
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-02",
					completedAt: null,
				},
				{
					id: "3",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
					createdAt: "2026-01-03",
					completedAt: null,
				},
			],
			isLoading: false,
			isError: false,
			recentToolSlugs: ["news-analyzer", "invoice-processor"],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("2 runs")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("1 run")).toBeInTheDocument();
	});

	it("links tools to their tool pages", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01",
					completedAt: null,
				},
			],
			isLoading: false,
			isError: false,
			recentToolSlugs: ["news-analyzer"],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget />);
		expect(
			screen.getByRole("link", { name: /News Analyzer/i }),
		).toHaveAttribute("href", "/app/tools/news-analyzer");
	});

	it("shows view all jobs link", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01",
					completedAt: null,
				},
			],
			isLoading: false,
			isError: false,
			recentToolSlugs: ["news-analyzer"],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget />);
		expect(
			screen.getByRole("link", { name: /View all jobs/i }),
		).toHaveAttribute("href", "/app/jobs");
	});

	it("respects maxTools limit", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2026-01-01",
					completedAt: null,
				},
				{
					id: "2",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
					createdAt: "2026-01-02",
					completedAt: null,
				},
			],
			isLoading: false,
			isError: false,
			recentToolSlugs: ["news-analyzer", "invoice-processor"],
			recentToolsMap: new Map(),
			error: null,
			refetch: vi.fn(),
		});
		render(<TopToolsWidget maxTools={1} />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.queryByText("Invoice Processor")).not.toBeInTheDocument();
	});
});
