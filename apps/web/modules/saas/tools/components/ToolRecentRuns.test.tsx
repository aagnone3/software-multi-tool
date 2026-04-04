import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolRecentRuns } from "./ToolRecentRuns";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));
vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLAnchorElement>;
		className?: string;
	}) => (
		<a href={href} onClick={onClick} className={className}>
			{children}
		</a>
	),
}));

import { useJobsList } from "@tools/hooks/use-job-polling";

const mockUseJobsList = vi.mocked(useJobsList);

const makeJob = (overrides = {}) =>
	({
		id: "job-1",
		status: "COMPLETED" as const,
		toolSlug: "contract-analyzer",
		createdAt: new Date(Date.now() - 5 * 60000),
		completedAt: new Date(),
		updatedAt: new Date(),
		userId: "user-1",
		sessionId: null,
		organizationId: null,
		error: null,
		output: null,
		inputHash: null,
		cachedJobId: null,
		isCached: false,
		attempts: 1,
		maxAttempts: 3,
		priority: 0,
		claimedAt: null,
		audioMetadata: null,
		newsAnalysis: null,
		...overrides,
		// biome-ignore lint/suspicious/noExplicitAny: test mock
	}) as any;

describe("ToolRecentRuns", () => {
	it("renders null when no jobs exist", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(
			<ToolRecentRuns toolSlug="contract-analyzer" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders loading skeletons while loading", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(
			<ToolRecentRuns toolSlug="contract-analyzer" />,
		);
		expect(container.firstChild).toBeTruthy();
	});

	it("renders recent runs when jobs exist", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob(), makeJob({ id: "job-2", status: "FAILED" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		expect(screen.getByText("Recent Runs")).toBeDefined();
		expect(screen.getByText("Completed")).toBeDefined();
		expect(screen.getByText("Failed")).toBeDefined();
	});

	it("shows 'View all' link to tool-specific history page", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob()],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const link = screen.getByRole("link", { name: /view all/i });
		expect(link.getAttribute("href")).toBe(
			"/app/tools/contract-analyzer/history",
		);
	});

	it("shows View link to /app/jobs/[id] for completed jobs", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ toolSlug: "news-analyzer" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="news-analyzer" />);
		const viewLinks = screen.getAllByRole("link", { name: /^view$/i });
		expect(viewLinks.length).toBeGreaterThan(0);
		expect(viewLinks[0].getAttribute("href")).toContain("/app/jobs/");
	});

	it("shows View link to /app/jobs/[id] for any tool slug", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ toolSlug: "contract-analyzer" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const viewLinks = screen.queryAllByRole("link", { name: /^view$/i });
		expect(viewLinks.length).toBeGreaterThan(0);
		expect(viewLinks[0].getAttribute("href")).toContain("/app/jobs/job-1");
	});

	it("shows View link for failed jobs too", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ id: "job-failed", status: "FAILED" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const viewLinks = screen.getAllByRole("link", { name: /^view$/i });
		expect(viewLinks.length).toBeGreaterThan(0);
		expect(viewLinks[0].getAttribute("href")).toContain(
			"/app/jobs/job-failed",
		);
	});

	it("does not show View link for pending or processing jobs", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				makeJob({ status: "PENDING" }),
				makeJob({ id: "job-2", status: "PROCESSING" }),
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const viewLinks = screen.queryAllByRole("link", { name: /^view$/i });
		expect(viewLinks).toHaveLength(0);
	});

	it("passes toolSlug and limit=3 to useJobsList", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="invoice-processor" />);
		expect(mockUseJobsList).toHaveBeenCalledWith("invoice-processor", 3);
	});

	it("tracks view all click", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob()],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByRole("link", { name: /view all/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_recent_runs_view_all_clicked",
			props: { tool_slug: "contract-analyzer" },
		});
	});

	it("tracks job view click", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ id: "job-xyz", status: "COMPLETED" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const viewLinks = screen.getAllByRole("link", { name: /^view$/i });
		await userEvent.click(viewLinks[0]);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_recent_runs_job_clicked",
			props: {
				tool_slug: "contract-analyzer",
				job_id: "job-xyz",
				job_status: "COMPLETED",
			},
		});
	});
});
