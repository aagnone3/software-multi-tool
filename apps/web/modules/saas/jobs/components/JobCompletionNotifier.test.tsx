import { render } from "@testing-library/react";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobCompletionNotifier } from "./JobCompletionNotifier";

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(() => ({ jobs: [] })),
}));

import { useJobsList } from "@tools/hooks/use-job-polling";

const mockUseJobsList = vi.mocked(useJobsList);

describe("JobCompletionNotifier", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing (null output)", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useJobsList>);
		const { container } = render(<JobCompletionNotifier />);
		expect(container.firstChild).toBeNull();
	});

	it("does not fire toast when no jobs exist", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useJobsList>);
		render(<JobCompletionNotifier />);
		expect(toast.success).not.toHaveBeenCalled();
		expect(toast.error).not.toHaveBeenCalled();
	});

	it("does not fire toast on first render (no previous status to compare)", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "job1",
					toolSlug: "contract-analyzer",
					status: "COMPLETED",
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useJobsList>);
		render(<JobCompletionNotifier />);
		// No previous status → no transition detected
		expect(toast.success).not.toHaveBeenCalled();
	});

	it("fires success toast with direct job link when job transitions to COMPLETED", () => {
		const { rerender } = render(<JobCompletionNotifier />);

		// First render: job is PROCESSING (seeds the prevStatusRef)
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "job-abc",
					toolSlug: "contract-analyzer",
					status: "PROCESSING",
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useJobsList>);
		rerender(<JobCompletionNotifier />);

		// Second render: job transitions to COMPLETED
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "job-abc",
					toolSlug: "contract-analyzer",
					status: "COMPLETED",
				},
			],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useJobsList>);
		rerender(<JobCompletionNotifier />);

		expect(toast.success).toHaveBeenCalledOnce();
		const call = vi.mocked(toast.success).mock.calls[0];
		// action.onClick should navigate to the specific job, not the list
		const action = (call[1] as { action?: { onClick: () => void } })
			?.action;
		expect(action).toBeDefined();
		action?.onClick();
		expect(window.location.href).toContain("/app/jobs/job-abc");
	});
});
