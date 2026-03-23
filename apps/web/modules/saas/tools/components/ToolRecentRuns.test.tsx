import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolRecentRuns } from "./ToolRecentRuns";

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
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

	it("shows 'View all' link to /app/jobs", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob()],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const link = screen.getByRole("link", { name: /view all/i });
		expect(link.getAttribute("href")).toBe("/app/jobs");
	});

	it("shows View link for tools with dedicated detail routes", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ toolSlug: "news-analyzer" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="news-analyzer" />);
		const viewLinks = screen.getAllByRole("link", { name: /^view$/i });
		expect(viewLinks.length).toBeGreaterThan(0);
		expect(viewLinks[0].getAttribute("href")).toContain(
			"/app/tools/news-analyzer/",
		);
	});

	it("does not show View link for non-detail-route tools", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob({ toolSlug: "contract-analyzer" })],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolRecentRuns toolSlug="contract-analyzer" />);
		const viewLinks = screen.queryAllByRole("link", { name: /^view$/i });
		expect(viewLinks.length).toBe(0);
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
});
