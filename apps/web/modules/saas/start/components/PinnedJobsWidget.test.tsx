import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPinnedJobs = vi.fn();
const mockUnpinJob = vi.fn();

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
		await userEvent.click(screen.getByTitle("Unpin"));
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
});
