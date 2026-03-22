import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	JobProgressIndicator,
	JobProgressInline,
} from "./JobProgressIndicator";

const useJobUpdatesMock = vi.hoisted(() => vi.fn());
const useCancelJobMock = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-job-updates", () => ({
	useJobUpdates: useJobUpdatesMock,
}));

vi.mock("../hooks/use-job-polling", () => ({
	useCancelJob: useCancelJobMock,
}));

const cancelMutateMock = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	useCancelJobMock.mockReturnValue({
		mutate: cancelMutateMock,
		isPending: false,
	});
});

describe("JobProgressIndicator", () => {
	it("renders pending state by default when no job", () => {
		useJobUpdatesMock.mockReturnValue({ job: null, error: null });
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Queued")).toBeInTheDocument();
		expect(screen.getByText("Processing")).toBeInTheDocument(); // default title
	});

	it("renders processing state", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PROCESSING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" title="My Job" />);
		expect(screen.getByText("Processing")).toBeInTheDocument();
		expect(screen.getByText("My Job")).toBeInTheDocument();
	});

	it("renders completed state", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "COMPLETED", output: {} },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Completed")).toBeInTheDocument();
	});

	it("renders failed state with error message", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "FAILED", error: "Something went wrong" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Failed")).toBeInTheDocument();
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("renders cancelled state", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "CANCELLED" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Cancelled")).toBeInTheDocument();
	});

	it("shows error card when error is present", () => {
		useJobUpdatesMock.mockReturnValue({
			job: null,
			error: new Error("Network error"),
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Error")).toBeInTheDocument();
		expect(
			screen.getByText("Failed to load job status"),
		).toBeInTheDocument();
	});

	it("shows cancel button in pending state", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel />);
		expect(
			screen.getByRole("button", { name: "Cancel" }),
		).toBeInTheDocument();
	});

	it("hides cancel button when showCancel=false", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel={false} />);
		expect(
			screen.queryByRole("button", { name: "Cancel" }),
		).not.toBeInTheDocument();
	});

	it("does not show cancel button in non-pending states", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PROCESSING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel />);
		expect(
			screen.queryByRole("button", { name: "Cancel" }),
		).not.toBeInTheDocument();
	});

	it("calls cancelMutate when cancel is clicked", async () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PENDING" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" showCancel />);
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(cancelMutateMock).toHaveBeenCalledWith({ jobId: "job-1" });
	});

	it("calls onComplete when job completes", () => {
		const onComplete = vi.fn();
		const output = { result: "done" };
		useJobUpdatesMock.mockReturnValue({
			job: { status: "COMPLETED", output },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" onComplete={onComplete} />);
		expect(onComplete).toHaveBeenCalledWith(output);
	});

	it("calls onError when job fails", () => {
		const onError = vi.fn();
		useJobUpdatesMock.mockReturnValue({
			job: { status: "FAILED", error: "Timed out" },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" onError={onError} />);
		expect(onError).toHaveBeenCalledWith("Timed out");
	});

	it("shows description when provided", () => {
		useJobUpdatesMock.mockReturnValue({ job: null, error: null });
		render(
			<JobProgressIndicator jobId="job-1" description="Analyzing..." />,
		);
		expect(screen.getByText("Analyzing...")).toBeInTheDocument();
	});

	it("shows attempt info when attempts > 1", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PROCESSING", attempts: 2, maxAttempts: 3 },
			error: null,
		});
		render(<JobProgressIndicator jobId="job-1" />);
		expect(screen.getByText("Attempt 2 of 3")).toBeInTheDocument();
	});
});

describe("JobProgressInline", () => {
	it("renders pending state by default", () => {
		useJobUpdatesMock.mockReturnValue({ job: null, error: null });
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Queued")).toBeInTheDocument();
	});

	it("renders processing label", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "PROCESSING" },
			error: null,
		});
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Processing")).toBeInTheDocument();
	});

	it("renders completed label", () => {
		useJobUpdatesMock.mockReturnValue({
			job: { status: "COMPLETED" },
			error: null,
		});
		render(<JobProgressInline jobId="job-1" />);
		expect(screen.getByText("Completed")).toBeInTheDocument();
	});
});
