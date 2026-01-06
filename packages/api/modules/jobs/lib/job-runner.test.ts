import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	handleStuckJobs,
	processAllPendingJobs,
	processNextJob,
	retryFailedJobs,
	runCleanup,
} from "./job-runner";
import * as processorRegistry from "./processor-registry";

// Mock database functions
const claimNextPendingJobMock = vi.hoisted(() => vi.fn());
const markJobCompletedMock = vi.hoisted(() => vi.fn());
const markJobFailedMock = vi.hoisted(() => vi.fn());
const requeueJobMock = vi.hoisted(() => vi.fn());
const getJobsToRetryMock = vi.hoisted(() => vi.fn());
const markStuckJobsAsFailedMock = vi.hoisted(() => vi.fn());
const cleanupExpiredJobsMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	claimNextPendingJob: claimNextPendingJobMock,
	markJobCompleted: markJobCompletedMock,
	markJobFailed: markJobFailedMock,
	requeueJob: requeueJobMock,
	getJobsToRetry: getJobsToRetryMock,
	markStuckJobsAsFailed: markStuckJobsAsFailedMock,
	cleanupExpiredJobs: cleanupExpiredJobsMock,
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

describe("Job Runner", () => {
	const mockJob = {
		id: "job-123",
		toolSlug: "bg-remover",
		status: "PROCESSING",
		priority: 0,
		input: { imageUrl: "https://example.com/image.png" },
		output: null,
		error: null,
		userId: "user-123",
		sessionId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("processNextJob", () => {
		it("returns false when no pending jobs", async () => {
			claimNextPendingJobMock.mockResolvedValue(null);

			const result = await processNextJob();

			expect(result).toEqual({ processed: false });
		});

		it("marks job as failed when no processor registered", async () => {
			claimNextPendingJobMock.mockResolvedValue(mockJob);
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				undefined,
			);

			const result = await processNextJob();

			expect(result).toEqual({ processed: true, jobId: "job-123" });
			expect(markJobFailedMock).toHaveBeenCalledWith(
				"job-123",
				"No processor registered for tool: bg-remover",
			);
		});

		it("completes job on successful processing", async () => {
			claimNextPendingJobMock.mockResolvedValue(mockJob);
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockResolvedValue({
					success: true,
					output: { resultUrl: "https://example.com/result.png" },
				}),
			);

			const result = await processNextJob();

			expect(result).toEqual({ processed: true, jobId: "job-123" });
			expect(markJobCompletedMock).toHaveBeenCalledWith("job-123", {
				resultUrl: "https://example.com/result.png",
			});
		});

		it("requeues job on failure with remaining attempts", async () => {
			claimNextPendingJobMock.mockResolvedValue({
				...mockJob,
				attempts: 1,
				maxAttempts: 3,
			});
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockResolvedValue({
					success: false,
					error: "Processing failed",
				}),
			);

			await processNextJob();

			expect(requeueJobMock).toHaveBeenCalled();
			expect(markJobFailedMock).not.toHaveBeenCalled();
		});

		it("marks job as failed when max attempts exceeded", async () => {
			claimNextPendingJobMock.mockResolvedValue({
				...mockJob,
				attempts: 3,
				maxAttempts: 3,
			});
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockResolvedValue({
					success: false,
					error: "Processing failed",
				}),
			);

			await processNextJob();

			expect(markJobFailedMock).toHaveBeenCalledWith(
				"job-123",
				"Processing failed",
			);
			expect(requeueJobMock).not.toHaveBeenCalled();
		});

		it("handles processor exceptions", async () => {
			claimNextPendingJobMock.mockResolvedValue({
				...mockJob,
				attempts: 3,
				maxAttempts: 3,
			});
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockRejectedValue(new Error("Unexpected error")),
			);

			await processNextJob();

			expect(markJobFailedMock).toHaveBeenCalledWith(
				"job-123",
				"Unexpected error",
			);
		});

		it("filters by toolSlug when provided", async () => {
			claimNextPendingJobMock.mockResolvedValue(null);

			await processNextJob("bg-remover");

			expect(claimNextPendingJobMock).toHaveBeenCalledWith("bg-remover");
		});
	});

	describe("processAllPendingJobs", () => {
		it("processes multiple jobs up to maxJobs limit", async () => {
			claimNextPendingJobMock
				.mockResolvedValueOnce(mockJob)
				.mockResolvedValueOnce({ ...mockJob, id: "job-124" })
				.mockResolvedValueOnce(null);
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockResolvedValue({ success: true, output: {} }),
			);

			const result = await processAllPendingJobs(undefined, 10);

			expect(result).toEqual({
				processed: 2,
				jobIds: ["job-123", "job-124"],
			});
		});

		it("respects maxJobs limit", async () => {
			claimNextPendingJobMock.mockResolvedValue(mockJob);
			vi.spyOn(processorRegistry, "getProcessor").mockReturnValue(
				vi.fn().mockResolvedValue({ success: true, output: {} }),
			);

			const result = await processAllPendingJobs(undefined, 2);

			expect(result.processed).toBe(2);
			expect(claimNextPendingJobMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("retryFailedJobs", () => {
		it("requeues failed jobs with backoff", async () => {
			getJobsToRetryMock.mockResolvedValue([
				{ ...mockJob, id: "job-1", attempts: 1 },
				{ ...mockJob, id: "job-2", attempts: 2 },
			]);

			const result = await retryFailedJobs();

			expect(result).toEqual({ retried: 2 });
			expect(requeueJobMock).toHaveBeenCalledTimes(2);
		});

		it("returns 0 when no jobs to retry", async () => {
			getJobsToRetryMock.mockResolvedValue([]);

			const result = await retryFailedJobs();

			expect(result).toEqual({ retried: 0 });
		});
	});

	describe("handleStuckJobs", () => {
		it("marks stuck jobs as failed", async () => {
			markStuckJobsAsFailedMock.mockResolvedValue({ count: 3 });

			const result = await handleStuckJobs(30);

			expect(result).toEqual({ count: 3 });
			expect(markStuckJobsAsFailedMock).toHaveBeenCalledWith(30);
		});
	});

	describe("runCleanup", () => {
		it("cleans up expired jobs", async () => {
			cleanupExpiredJobsMock.mockResolvedValue({ count: 5 });

			const result = await runCleanup();

			expect(result).toEqual({ deleted: 5 });
		});
	});
});
