import { cleanup, render } from "@testing-library/react";
import { useJobsList } from "@tools/hooks/use-job-polling";
import React from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobCompletionNotifier } from "./JobCompletionNotifier";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					enabled: true,
				},
				{ slug: "news-analyzer", name: "News Analyzer", enabled: true },
			],
		},
	},
}));

const mockUseJobsList = vi.mocked(useJobsList);

describe("JobCompletionNotifier", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders nothing (null)", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(<JobCompletionNotifier />);
		expect(container).toBeEmptyDOMElement();
	});

	it("fires success toast when job transitions to COMPLETED", () => {
		const { rerender } = render(<JobCompletionNotifier />);

		// First render: job is PROCESSING
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "j1",
					toolSlug: "invoice-processor",
					status: "PROCESSING",
				},
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		// Second render: job is COMPLETED
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "j1",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
				},
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		expect(toast.success).toHaveBeenCalledWith(
			"Invoice Processor job complete",
			expect.objectContaining({
				description: "Your results are ready to view.",
			}),
		);
	});

	it("fires error toast when job transitions to FAILED", () => {
		const { rerender } = render(<JobCompletionNotifier />);

		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "j2",
					toolSlug: "news-analyzer",
					status: "PROCESSING",
				},
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		mockUseJobsList.mockReturnValue({
			jobs: [
				{ id: "j2", toolSlug: "news-analyzer", status: "FAILED" },
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		expect(toast.error).toHaveBeenCalledWith(
			"News Analyzer job failed",
			expect.objectContaining({
				description: "Something went wrong. Try running it again.",
			}),
		);
	});

	it("does not toast if job was already in terminal state on first observe", () => {
		const { rerender } = render(<JobCompletionNotifier />);

		// First observe: already COMPLETED (no previousStatus in map)
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "j3",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
				},
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		expect(toast.success).not.toHaveBeenCalled();
	});

	it("does not toast for same-status updates", () => {
		const { rerender } = render(<JobCompletionNotifier />);

		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "j4",
					toolSlug: "invoice-processor",
					status: "PROCESSING",
				},
			] as any,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		rerender(<JobCompletionNotifier />);

		// Same PROCESSING status again
		rerender(<JobCompletionNotifier />);

		expect(toast.success).not.toHaveBeenCalled();
		expect(toast.error).not.toHaveBeenCalled();
	});
});
