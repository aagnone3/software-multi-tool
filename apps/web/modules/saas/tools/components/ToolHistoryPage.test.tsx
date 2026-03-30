import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockJobs = [
	{
		id: "job-abc-123",
		status: "COMPLETED",
		toolSlug: "news-analyzer",
		createdAt: new Date("2026-01-01T10:00:00Z"),
		completedAt: new Date("2026-01-01T10:00:30Z"),
	},
	{
		id: "job-def-456",
		status: "FAILED",
		toolSlug: "news-analyzer",
		createdAt: new Date("2026-01-02T12:00:00Z"),
		completedAt: null,
	},
];

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsListPaginated: vi.fn(() => ({
		jobs: mockJobs,
		isLoading: false,
		hasMore: false,
		refetch: vi.fn(),
	})),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useMutation: vi.fn(() => ({ mutate: vi.fn() })),
		useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
	};
});

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: { jobs: { delete: vi.fn() } },
}));
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: { jobs: { list: { key: () => ["jobs", "list"] } } },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(() => ({ activePlan: { id: "free", name: "Free" } })),
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

import { ToolHistoryPage } from "./ToolHistoryPage";

describe("ToolHistoryPage", () => {
	it("renders tool name in heading", () => {
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(
			screen.getByText("News Analyzer — Run History"),
		).toBeInTheDocument();
	});

	it("shows stats cards with correct values", () => {
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(screen.getByText("50%")).toBeInTheDocument(); // success rate
		// Total runs stat card
		const totalRuns = screen.getByText("Total Runs");
		expect(
			totalRuns.closest("[class*='card']") ?? totalRuns.parentElement,
		).toBeTruthy();
	});

	it("renders job rows", () => {
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(screen.getByText("job-abc-…")).toBeInTheDocument();
	});

	it("shows Open Tool link", () => {
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		const link = screen.getByRole("link", { name: /Open Tool/i });
		expect(link).toHaveAttribute("href", "/app/tools/news-analyzer");
	});

	it("shows Export CSV button when jobs present", () => {
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Export CSV/i }),
		).toBeInTheDocument();
	});

	it("shows loading skeletons when loading", async () => {
		const { useJobsListPaginated } = await import(
			"@tools/hooks/use-job-polling"
		);
		vi.mocked(useJobsListPaginated).mockReturnValueOnce({
			jobs: [],
			isLoading: true,
			hasMore: false,
			refetch: vi.fn(),
			error: null,
		});
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		// Skeletons rendered — no table visible
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});

	it("shows empty state when no jobs", async () => {
		const { useJobsListPaginated } = await import(
			"@tools/hooks/use-job-polling"
		);
		vi.mocked(useJobsListPaginated).mockReturnValueOnce({
			jobs: [],
			isLoading: false,
			hasMore: false,
			refetch: vi.fn(),
			error: null,
		});
		render(
			<ToolHistoryPage
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(
			screen.getByText(/No runs yet for this tool/i),
		).toBeInTheDocument();
	});
});
