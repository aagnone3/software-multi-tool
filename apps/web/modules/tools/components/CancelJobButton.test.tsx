import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();
const mockMutate = vi.fn();
const mockTrack = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

let mutationIsPending = false;
let mutationOnSuccess: (() => void) | null = null;
let mutationOnError: ((err: unknown) => void) | null = null;

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			cancel: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: (opts: {
		onSuccess?: () => void;
		onError?: (e: unknown) => void;
	}) => {
		mutationOnSuccess = opts.onSuccess ?? null;
		mutationOnError = opts.onError ?? null;
		return {
			isPending: mutationIsPending,
			mutate: mockMutate.mockImplementation(() => mutationOnSuccess?.()),
			mutateAsync: mockMutateAsync,
		};
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

import { CancelJobButton } from "./CancelJobButton";

describe("CancelJobButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mutationIsPending = false;
		mutationOnSuccess = null;
		mutationOnError = null;
	});

	it("opens the confirmation dialog when clicked", () => {
		render(<CancelJobButton jobId="job-1" toolSlug="news-analyzer" />);
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(screen.getByText(/Cancel this analysis/i)).toBeInTheDocument();
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "job_cancel_clicked" }),
		);
	});

	it("dispatches the cancel mutation with the job id when confirmed", async () => {
		const onCancelled = vi.fn();
		render(
			<CancelJobButton
				jobId="job-2"
				toolSlug="news-analyzer"
				onCancelled={onCancelled}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		fireEvent.click(screen.getByRole("button", { name: /cancel job/i }));

		expect(mockMutate).toHaveBeenCalledWith({ jobId: "job-2" });
		await waitFor(() => {
			expect(mockToastSuccess).toHaveBeenCalledWith(
				expect.stringContaining("refunded"),
			);
			expect(onCancelled).toHaveBeenCalled();
		});
	});
});
