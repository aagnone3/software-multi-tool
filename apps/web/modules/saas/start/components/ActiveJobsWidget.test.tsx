import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseRecentJobs = vi.fn();
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => mockUseRecentJobs(),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{ slug: "news-analyzer", name: "News Analyzer", enabled: true },
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					enabled: true,
				},
			],
		},
	},
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: React.MouseEventHandler<HTMLAnchorElement>;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

import { ActiveJobsWidget } from "./ActiveJobsWidget";

function makeJob(
	overrides: Partial<{
		id: string;
		toolSlug: string;
		status: string;
		createdAt: string;
		completedAt: string | null;
	}> = {},
) {
	return {
		id: "job-1",
		toolSlug: "news-analyzer",
		status: "PROCESSING",
		createdAt: new Date().toISOString(),
		completedAt: null,
		...overrides,
	};
}

describe("ActiveJobsWidget", () => {
	it("renders nothing when no active or recent jobs", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		const { container } = render(<ActiveJobsWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when only old completed jobs", () => {
		const oldDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob({
					status: "COMPLETED",
					completedAt: oldDate,
				}),
			],
			isLoading: false,
		});
		const { container } = render(<ActiveJobsWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("shows processing job", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob({ status: "PROCESSING" })],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByText("Active Jobs")).toBeInTheDocument();
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Running")).toBeInTheDocument();
	});

	it("shows pending job", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob({ status: "PENDING" })],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByText("Queued")).toBeInTheDocument();
	});

	it("shows recently completed job", () => {
		const recentDate = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob({
					status: "COMPLETED",
					completedAt: recentDate,
				}),
			],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByText("Done")).toBeInTheDocument();
	});

	it("shows failed job", () => {
		const recentDate = new Date(Date.now() - 60 * 1000).toISOString();
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob({
					status: "FAILED",
					completedAt: recentDate,
				}),
			],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByText("Failed")).toBeInTheDocument();
	});

	it("shows All jobs link", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob({ status: "PROCESSING" })],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByRole("link", { name: /all jobs/i })).toHaveAttribute(
			"href",
			"/app/jobs",
		);
	});
});

describe("ActiveJobsWidget error state", () => {
	it("shows error state when jobs query fails", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
			isError: true,
		});
		render(<ActiveJobsWidget />);
		expect(screen.getByText("Failed to load jobs")).toBeDefined();
	});
});

describe("ActiveJobsWidget analytics", () => {
	beforeEach(() => {
		mockTrack.mockClear();
	});

	it("tracks view click for completed jobs", () => {
		const completedJob = makeJob({
			status: "COMPLETED",
			completedAt: new Date().toISOString(),
		});
		mockUseRecentJobs.mockReturnValue({
			jobs: [completedJob],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		const viewLink = screen.getByRole("link", { name: /view/i });
		fireEvent.click(viewLink);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "dashboard_active_job_view_clicked",
			props: {
				job_id: completedJob.id,
				tool_slug: completedJob.toolSlug,
				job_status: "COMPLETED",
			},
		});
	});
});

describe("ActiveJobsWidget view link URL", () => {
	it("shows View link for any completed tool using universal job route", () => {
		const completedJob = makeJob({
			id: "job-abc",
			toolSlug: "expense-categorizer",
			status: "COMPLETED",
			completedAt: new Date().toISOString(),
		});
		mockUseRecentJobs.mockReturnValue({
			jobs: [completedJob],
			isLoading: false,
		});
		render(<ActiveJobsWidget />);
		const viewLink = screen.getByRole("link", { name: /view/i });
		expect(viewLink).toHaveAttribute("href", "/app/jobs/job-abc");
	});
});
