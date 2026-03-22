import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseRecentJobs = vi.fn();
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => mockUseRecentJobs(),
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
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
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
