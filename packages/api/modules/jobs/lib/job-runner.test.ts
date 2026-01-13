import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	handleStuckJobs,
	processAllPendingJobs,
	processNextJob,
	retryFailedJobs,
	runCleanup,
} from "./job-runner";

// Mock database functions
const markStuckJobsAsFailedMock = vi.hoisted(() => vi.fn());
const cleanupExpiredJobsMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
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

import { logger } from "@repo/logs";

describe("Job Runner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Maintenance Functions", () => {
		describe("handleStuckJobs", () => {
			it("marks stuck jobs as failed", async () => {
				markStuckJobsAsFailedMock.mockResolvedValue({ count: 3 });

				const result = await handleStuckJobs(30);

				expect(result).toEqual({ count: 3 });
				expect(markStuckJobsAsFailedMock).toHaveBeenCalledWith(30);
			});

			it("uses default timeout of 30 minutes", async () => {
				markStuckJobsAsFailedMock.mockResolvedValue({ count: 0 });

				await handleStuckJobs();

				expect(markStuckJobsAsFailedMock).toHaveBeenCalledWith(30);
			});

			it("logs warning when stuck jobs are found", async () => {
				markStuckJobsAsFailedMock.mockResolvedValue({ count: 5 });

				await handleStuckJobs(30);

				expect(logger.warn).toHaveBeenCalledWith(
					expect.stringContaining("5 stuck jobs"),
				);
			});

			it("does not log when no stuck jobs found", async () => {
				markStuckJobsAsFailedMock.mockResolvedValue({ count: 0 });

				await handleStuckJobs(30);

				expect(logger.warn).not.toHaveBeenCalled();
			});
		});

		describe("runCleanup", () => {
			it("cleans up expired jobs", async () => {
				cleanupExpiredJobsMock.mockResolvedValue({ count: 5 });

				const result = await runCleanup();

				expect(result).toEqual({ deleted: 5 });
			});

			it("logs info when jobs are cleaned up", async () => {
				cleanupExpiredJobsMock.mockResolvedValue({ count: 10 });

				await runCleanup();

				expect(logger.info).toHaveBeenCalledWith(
					expect.stringContaining("10 expired jobs"),
				);
			});

			it("does not log when no jobs cleaned up", async () => {
				cleanupExpiredJobsMock.mockResolvedValue({ count: 0 });

				await runCleanup();

				expect(logger.info).not.toHaveBeenCalled();
			});
		});
	});

	describe("Deprecated Functions", () => {
		describe("processNextJob", () => {
			it("returns false and logs deprecation warning", async () => {
				const result = await processNextJob();

				expect(result).toEqual({ processed: false });
				expect(logger.warn).toHaveBeenCalledWith(
					expect.stringContaining("DEPRECATED"),
				);
			});

			it("returns false regardless of toolSlug", async () => {
				const result = await processNextJob("news-analyzer");

				expect(result).toEqual({ processed: false });
			});
		});

		describe("processAllPendingJobs", () => {
			it("returns empty result and logs deprecation warning", async () => {
				const result = await processAllPendingJobs();

				expect(result).toEqual({ processed: 0, jobIds: [] });
				expect(logger.warn).toHaveBeenCalledWith(
					expect.stringContaining("DEPRECATED"),
				);
			});

			it("returns empty result regardless of parameters", async () => {
				const result = await processAllPendingJobs(
					"news-analyzer",
					100,
				);

				expect(result).toEqual({ processed: 0, jobIds: [] });
			});
		});

		describe("retryFailedJobs", () => {
			it("returns zero and logs deprecation warning", async () => {
				const result = await retryFailedJobs();

				expect(result).toEqual({ retried: 0 });
				expect(logger.warn).toHaveBeenCalledWith(
					expect.stringContaining("DEPRECATED"),
				);
			});
		});
	});
});
