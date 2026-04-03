import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
const mockPinnedJobs = vi.fn();
const mockUnpinJob = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@tools/hooks/use-pinned-jobs", () => ({
	usePinnedJobs: () => ({
		pinnedJobs: mockPinnedJobs(),
		unpinJob: mockUnpinJob,
	}),
}));

import { PinnedJobsWidget } from "./PinnedJobsWidget";

describe("PinnedJobsWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows empty state when no pinned jobs", () => {
		mockPinnedJobs.mockReturnValue([]);
		render(<PinnedJobsWidget />);
		expect(screen.getByText("No pinned outputs yet.")).toBeInTheDocument();
	});

	it("shows pinned job entries", () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});

	it("shows pinned count", () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		expect(screen.getByText("1 pinned")).toBeInTheDocument();
	});

	it("shows note when present", () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
				note: "My important analysis",
			},
		]);
		render(<PinnedJobsWidget />);
		expect(screen.getByText("My important analysis")).toBeInTheDocument();
	});

	it("calls unpinJob when unpin button clicked", async () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		await userEvent.click(
			screen.getByRole("button", { name: /unpin news analyzer/i }),
		);
		expect(mockUnpinJob).toHaveBeenCalledWith("job-1");
	});

	it("links to job detail page", () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-abc",
				toolSlug: "invoice-processor",
				toolName: "Invoice Processor",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		const link = screen.getByRole("link", { name: /Invoice Processor/i });
		expect(link).toHaveAttribute("href", "/app/jobs/job-abc");
	});

	it("tracks dashboard_pinned_job_clicked when a job link is clicked", async () => {
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-xyz",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		const link = screen.getByRole("link", { name: /News Analyzer/i });
		await userEvent.click(link);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "dashboard_pinned_job_clicked",
			props: { job_id: "job-xyz", tool_name: "News Analyzer" },
		});
	});

	it("tracks job_unpinned when unpin button is clicked", async () => {
		mockTrack.mockClear();
		mockPinnedJobs.mockReturnValue([
			{
				id: "job-unpin",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
				pinnedAt: new Date().toISOString(),
			},
		]);
		render(<PinnedJobsWidget />);
		await userEvent.click(
			screen.getByRole("button", { name: /unpin news analyzer/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "job_unpinned",
			props: { job_id: "job-unpin" },
		});
	});
});
