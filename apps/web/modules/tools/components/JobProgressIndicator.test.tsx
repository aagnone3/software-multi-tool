import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	JobProgressIndicator,
	JobProgressInline,
} from "./JobProgressIndicator";

const mockCancelMutate = vi.fn();

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("../hooks/use-job-polling", () => ({
	useCancelJob: () => ({ mutate: mockCancelMutate, isPending: false }),
}));

const mockUseJobUpdates = vi.fn();

vi.mock("../hooks/use-job-updates", () => ({
	useJobUpdates: (...args: unknown[]) => mockUseJobUpdates(...args),
}));

vi.mock("./PostJobInviteNudge", () => ({
	PostJobInviteNudge: () => <div data-testid="invite-nudge" />,
}));

vi.mock("./PostJobShareNudge", () => ({
	PostJobShareNudge: () => <div data-testid="share-nudge" />,
}));

vi.mock("./PostJobUpgradeNudge", () => ({
	PostJobUpgradeNudge: () => <div data-testid="upgrade-nudge" />,
}));

describe("JobProgressIndicator", () => {
	it("shows loading/pending state", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" title="Processing" />);
		expect(screen.getByText("Processing")).toBeInTheDocument();
		expect(screen.getByText("Queued")).toBeInTheDocument();
	});

	it("shows processing state", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "PROCESSING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" title="My Task" />);
		expect(screen.getByText("My Task")).toBeInTheDocument();
		// Both title and status label contain "Processing" — just check status badge
		expect(screen.getAllByText("Processing").length).toBeGreaterThan(0);
	});

	it("shows completed state with nudges", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "COMPLETED", output: { result: "done" } },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getByTestId("upgrade-nudge")).toBeInTheDocument();
		expect(screen.getByTestId("share-nudge")).toBeInTheDocument();
		expect(screen.getByTestId("invite-nudge")).toBeInTheDocument();
	});

	it("calls onComplete when job completes", () => {
		const onComplete = vi.fn();
		const output = { result: "done" };
		mockUseJobUpdates.mockReturnValue({
			job: { status: "COMPLETED", output },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" onComplete={onComplete} />);
		expect(onComplete).toHaveBeenCalledWith(output);
	});

	it("calls onError when job fails", () => {
		const onError = vi.fn();
		mockUseJobUpdates.mockReturnValue({
			job: { status: "FAILED", error: "Something went wrong" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" onError={onError} />);
		expect(onError).toHaveBeenCalledWith("Something went wrong");
	});

	it("shows failed error message", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "FAILED", error: "Something went wrong" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("shows insufficient credits UI for credits error", () => {
		mockUseJobUpdates.mockReturnValue({
			job: {
				status: "FAILED",
				error: "insufficient credits to complete job",
			},
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Insufficient Credits")).toBeInTheDocument();
		expect(screen.getByText("Buy Credits")).toBeInTheDocument();
	});

	it("shows fetch error state", () => {
		mockUseJobUpdates.mockReturnValue({
			job: null,
			error: new Error("network error"),
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(
			screen.getByText("Failed to load job status"),
		).toBeInTheDocument();
	});

	it("shows cancel button for PENDING jobs", async () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel={true} />);
		const cancelBtn = screen.getByText("Cancel");
		await userEvent.click(cancelBtn);
		expect(mockCancelMutate).toHaveBeenCalledWith({ jobId: "job-1" });
	});

	it("hides cancel when showCancel=false", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel={false} />);
		expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
	});

	it("shows retry attempt info", () => {
		mockUseJobUpdates.mockReturnValue({
			job: { status: "PROCESSING", attempts: 2, maxAttempts: 3 },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Attempt 2 of 3")).toBeInTheDocument();
	});
});

describe("JobProgressInline", () => {
	it("shows pending state", () => {
		mockUseJobUpdates.mockReturnValue({ job: { status: "PENDING" } });
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Queued")).toBeInTheDocument();
	});

	it("shows completed state", () => {
		mockUseJobUpdates.mockReturnValue({ job: { status: "COMPLETED" } });
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Completed")).toBeInTheDocument();
	});

	it("defaults to PENDING when no job", () => {
		mockUseJobUpdates.mockReturnValue({ job: null });
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Queued")).toBeInTheDocument();
	});
});
