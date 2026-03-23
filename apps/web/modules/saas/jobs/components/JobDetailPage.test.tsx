// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobDetailPage } from "./JobDetailPage";

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobPolling: vi.fn(),
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

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

import { useJobPolling } from "@tools/hooks/use-job-polling";

const mockUseJobPolling = vi.mocked(useJobPolling);

const baseJob = {
	id: "job-abc123",
	toolSlug: "news-analyzer",
	status: "COMPLETED" as const,
	createdAt: "2026-03-23T01:00:00Z",
	completedAt: "2026-03-23T01:02:30Z",
	output: { summary: "test result" },
	newsAnalysis: null,
};

describe("JobDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading skeletons while loading", () => {
		mockUseJobPolling.mockReturnValue({
			job: undefined,
			isLoading: true,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		// Skeletons are rendered (no main content)
		expect(screen.queryByText("News Analyzer")).not.toBeInTheDocument();
	});

	it("shows job not found when job is null", () => {
		mockUseJobPolling.mockReturnValue({
			job: null,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("Job not found")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Back to Job History" }),
		).toBeInTheDocument();
	});

	it("renders tool name from registry", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});

	it("renders job ID", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("Job ID: job-abc123")).toBeInTheDocument();
	});

	it("renders Completed status badge", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
	});

	it("renders duration for completed job", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("2m 30s")).toBeInTheDocument();
	});

	it("renders output viewer with JSON", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText(/summary/)).toBeInTheDocument();
	});

	it("renders Run Again action for completed job", () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(
			screen.getByRole("link", { name: "Run News Analyzer Again" }),
		).toBeInTheDocument();
	});

	it("renders error card for FAILED job without output", () => {
		mockUseJobPolling.mockReturnValue({
			job: { ...baseJob, status: "FAILED", output: null },
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("Job Failed")).toBeInTheDocument();
	});

	it("shows auto-refresh note for in-progress job", () => {
		mockUseJobPolling.mockReturnValue({
			job: {
				...baseJob,
				status: "PROCESSING",
				completedAt: null,
				output: null,
			},
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText(/auto-refreshes/i)).toBeInTheDocument();
	});

	it("falls back to toolSlug for unknown tool name", () => {
		mockUseJobPolling.mockReturnValue({
			job: { ...baseJob, toolSlug: "unknown-tool" },
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(screen.getByText("unknown-tool")).toBeInTheDocument();
	});

	it("shows Copy button in output viewer", async () => {
		mockUseJobPolling.mockReturnValue({
			job: baseJob,
			isLoading: false,
			invalidateJob: vi.fn(),
		});
		render(<JobDetailPage jobId="job-abc123" />);
		expect(
			screen.getByRole("button", { name: "Copy output" }),
		).toBeInTheDocument();
	});
});
