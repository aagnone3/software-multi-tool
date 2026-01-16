import { beforeEach, describe, expect, it, vi } from "vitest";
import { STUCK_JOB_TIMEOUT_MINUTES } from "./job-config";
import {
	handleStuckJobs,
	processAllPendingJobs,
	processNextJob,
	reconcileJobStates,
	retryFailedJobs,
	runCleanup,
} from "./job-runner";

// Mock database functions
const markStuckJobsAsFailedMock = vi.hoisted(() => vi.fn());
const cleanupExpiredJobsMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({
	toolJob: {
		findMany: vi.fn(),
		update: vi.fn(),
	},
	$queryRaw: vi.fn(),
}));

vi.mock("@repo/database", () => ({
	markStuckJobsAsFailed: markStuckJobsAsFailedMock,
	cleanupExpiredJobs: cleanupExpiredJobsMock,
	db: dbMock,
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
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

			it("uses default timeout from job-config", async () => {
				markStuckJobsAsFailedMock.mockResolvedValue({ count: 0 });

				await handleStuckJobs();

				expect(markStuckJobsAsFailedMock).toHaveBeenCalledWith(
					STUCK_JOB_TIMEOUT_MINUTES,
				);
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

	describe("reconcileJobStates", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("returns zeros when no PROCESSING jobs with pgBossJobId exist", async () => {
			dbMock.toolJob.findMany.mockResolvedValue([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 0,
				completed: 0,
				failed: 0,
				expired: 0,
			});
			expect(logger.debug).toHaveBeenCalledWith(
				expect.stringContaining("No PROCESSING jobs"),
			);
		});

		it("syncs completed jobs from pg-boss to ToolJob", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			// First $queryRaw call returns pg-boss job state
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "completed", output: {} },
				])
				// Second call returns empty archive
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 1,
				completed: 1,
				failed: 0,
				expired: 0,
			});
			expect(dbMock.toolJob.update).toHaveBeenCalledWith({
				where: { id: "tool-job-1" },
				data: expect.objectContaining({
					status: "COMPLETED",
				}),
			});
		});

		it("syncs failed jobs from pg-boss to ToolJob", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "failed", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 1,
				completed: 0,
				failed: 1,
				expired: 0,
			});
			expect(dbMock.toolJob.update).toHaveBeenCalledWith({
				where: { id: "tool-job-1" },
				data: expect.objectContaining({
					status: "FAILED",
					error: expect.stringContaining("synced from pg-boss"),
				}),
			});
		});

		it("syncs expired jobs from pg-boss to ToolJob", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "expired", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 1,
				completed: 0,
				failed: 0,
				expired: 1,
			});
			expect(dbMock.toolJob.update).toHaveBeenCalledWith({
				where: { id: "tool-job-1" },
				data: expect.objectContaining({
					status: "FAILED",
					error: expect.stringContaining("expired"),
				}),
			});
		});

		it("syncs cancelled jobs from pg-boss to ToolJob", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "cancelled", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 1,
				completed: 0,
				failed: 0,
				expired: 0,
			});
			expect(dbMock.toolJob.update).toHaveBeenCalledWith({
				where: { id: "tool-job-1" },
				data: expect.objectContaining({
					status: "CANCELLED",
				}),
			});
		});

		it("does not sync jobs still in active state", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "active", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 0,
				completed: 0,
				failed: 0,
				expired: 0,
			});
			expect(dbMock.toolJob.update).not.toHaveBeenCalled();
		});

		it("does not sync jobs in retry state", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "retry", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 0,
				completed: 0,
				failed: 0,
				expired: 0,
			});
			expect(dbMock.toolJob.update).not.toHaveBeenCalled();
		});

		it("does not sync jobs in created state", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "created", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 0,
				completed: 0,
				failed: 0,
				expired: 0,
			});
			expect(dbMock.toolJob.update).not.toHaveBeenCalled();
		});

		it("checks archive for jobs not found in main table", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			// Main table returns empty
			dbMock.$queryRaw
				.mockResolvedValueOnce([])
				// Archive returns the completed job
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "completed", output: {} },
				]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 1,
				completed: 1,
				failed: 0,
				expired: 0,
			});
		});

		it("handles multiple jobs in various states", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
				{
					id: "tool-job-2",
					pgBossJobId: "pg-boss-job-2",
					toolSlug: "news-analyzer",
				},
				{
					id: "tool-job-3",
					pgBossJobId: "pg-boss-job-3",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			dbMock.$queryRaw
				.mockResolvedValueOnce([
					{ id: "pg-boss-job-1", state: "completed", output: {} },
					{ id: "pg-boss-job-2", state: "failed", output: null },
					{ id: "pg-boss-job-3", state: "active", output: null },
				])
				.mockResolvedValueOnce([]);

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: true,
				synced: 2,
				completed: 1,
				failed: 1,
				expired: 0,
			});
		});

		it("logs warning when pg-boss job not found", async () => {
			const processingJobs = [
				{
					id: "tool-job-1",
					pgBossJobId: "pg-boss-job-1",
					toolSlug: "news-analyzer",
				},
			];

			dbMock.toolJob.findMany.mockResolvedValue(processingJobs);
			// Both queries return empty - job not found
			dbMock.$queryRaw.mockResolvedValue([]);

			await reconcileJobStates();

			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("pg-boss-job-1 not found"),
			);
		});

		it("handles database errors gracefully and returns error info", async () => {
			dbMock.toolJob.findMany.mockRejectedValue(new Error("DB error"));

			const result = await reconcileJobStates();

			expect(result).toEqual({
				success: false,
				synced: 0,
				completed: 0,
				failed: 0,
				expired: 0,
				error: "DB error",
			});
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Failed to reconcile"),
				expect.any(Object),
			);
		});
	});
});
