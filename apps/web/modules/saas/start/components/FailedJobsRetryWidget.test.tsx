import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockState = {
	jobs: [] as Array<{
		id: string;
		toolSlug: string;
		status: string;
		createdAt: string;
		completedAt: string | null;
	}>,
	isLoading: false,
};

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => ({
		jobs: mockState.jobs,
		isLoading: mockState.isLoading,
	}),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{ slug: "news-analyzer", name: "News Analyzer" },
				{ slug: "invoice-processor", name: "Invoice Processor" },
			],
		},
	},
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: { jobs: { create: vi.fn() } },
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { FailedJobsRetryWidget } from "./FailedJobsRetryWidget";

const baseJob = {
	id: "job-1",
	toolSlug: "news-analyzer",
	status: "FAILED",
	createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
	completedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
};

describe("FailedJobsRetryWidget", () => {
	it("renders null when no failed jobs", () => {
		mockState.jobs = [];
		mockState.isLoading = false;
		const { container } = render(<FailedJobsRetryWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders null while loading", () => {
		mockState.jobs = [];
		mockState.isLoading = true;
		const { container } = render(<FailedJobsRetryWidget />);
		expect(container.firstChild).toBeNull();
		mockState.isLoading = false;
	});

	it("renders failed jobs", () => {
		mockState.jobs = [baseJob];
		render(<FailedJobsRetryWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});

	it("shows correct failed count in description", () => {
		mockState.jobs = [baseJob];
		render(<FailedJobsRetryWidget />);
		expect(screen.getByText("1 job needs attention")).toBeInTheDocument();
	});

	it("shows plural for multiple failed jobs", () => {
		mockState.jobs = [
			baseJob,
			{ ...baseJob, id: "job-2", toolSlug: "invoice-processor" },
		];
		render(<FailedJobsRetryWidget />);
		expect(screen.getByText("2 jobs need attention")).toBeInTheDocument();
	});

	it("links to job detail page", () => {
		mockState.jobs = [baseJob];
		render(<FailedJobsRetryWidget />);
		const link = screen.getByRole("link", { name: /news analyzer/i });
		expect(link).toHaveAttribute("href", "/app/jobs/job-1");
	});

	it("shows View all failed jobs link", () => {
		mockState.jobs = [baseJob];
		render(<FailedJobsRetryWidget />);
		expect(
			screen.getByRole("link", { name: /view all failed jobs/i }),
		).toHaveAttribute("href", "/app/jobs?status=FAILED");
	});

	it("tracks failed_job_retry_clicked when retry button clicked", async () => {
		mockState.jobs = [baseJob];
		render(<FailedJobsRetryWidget />);
		const retryBtn = screen.getByRole("link", { name: /retry/i });
		await userEvent.click(retryBtn);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "failed_job_retry_clicked",
			props: { tool_slug: "news-analyzer" },
		});
	});

	it("respects maxJobs prop", () => {
		mockState.jobs = Array.from({ length: 10 }, (_, i) => ({
			...baseJob,
			id: `job-${i}`,
		}));
		render(<FailedJobsRetryWidget maxJobs={3} />);
		const jobLinks = screen
			.getAllByRole("link")
			.filter((l) =>
				l.getAttribute("href")?.startsWith("/app/jobs/job-"),
			);
		expect(jobLinks).toHaveLength(3);
	});
});
