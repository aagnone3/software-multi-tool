import type { PostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { createPostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

type ToolJobQueries = typeof import("@repo/database");

describe.sequential("deleteJob integration", () => {
	let harness: PostgresTestHarness | undefined;
	let toolJobQueries: ToolJobQueries;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
		toolJobQueries = await import("@repo/database");
		await harness.resetDatabase();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		await harness?.resetDatabase();
	});

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	it(
		"deletes job from database",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Create a job
			const job = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article" },
				sessionId: `test-session-${Date.now()}`,
			});

			expect(job).toBeDefined();
			expect(job?.id).toBeTruthy();

			// Verify job exists
			const existingJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(existingJob).toBeDefined();

			// Delete the job
			await toolJobQueries.deleteToolJob(job.id);

			// Verify job is deleted
			const deletedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(deletedJob).toBeNull();
		},
		TEST_TIMEOUT,
	);

	it(
		"deletes job with completed status",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Create a completed job
			const job = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article" },
				sessionId: `test-session-${Date.now()}`,
			});

			// Mark as completed
			await toolJobQueries.markJobCompleted(job.id, {
				bias: "moderate",
				summary: "Test summary",
			});

			// Verify job is completed
			const completedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(completedJob?.status).toBe("COMPLETED");
			expect(completedJob?.output).toBeDefined();

			// Delete the job
			await toolJobQueries.deleteToolJob(job.id);

			// Verify job is deleted
			const deletedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(deletedJob).toBeNull();
		},
		TEST_TIMEOUT,
	);

	it(
		"deletes job with failed status",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Create a job
			const job = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article" },
				sessionId: `test-session-${Date.now()}`,
			});

			// Mark as failed
			await toolJobQueries.markJobFailed(job.id, "Test error message");

			// Verify job is failed
			const failedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(failedJob?.status).toBe("FAILED");
			expect(failedJob?.error).toBe("Test error message");

			// Delete the job
			await toolJobQueries.deleteToolJob(job.id);

			// Verify job is deleted
			const deletedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(deletedJob).toBeNull();
		},
		TEST_TIMEOUT,
	);

	it(
		"deletes job with processing status",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Create a job
			const job = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article" },
				sessionId: `test-session-${Date.now()}`,
			});

			// Mark as processing
			await harness.prisma.toolJob.update({
				where: { id: job.id },
				data: {
					status: "PROCESSING",
					startedAt: new Date(),
				},
			});

			// Verify job is processing
			const processingJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(processingJob?.status).toBe("PROCESSING");

			// Delete the job
			await toolJobQueries.deleteToolJob(job.id);

			// Verify job is deleted
			const deletedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job.id },
			});
			expect(deletedJob).toBeNull();
		},
		TEST_TIMEOUT,
	);

	it(
		"throws error when deleting non-existent job",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Try to delete a job that doesn't exist
			const nonExistentId = "clz00000000000000000000000";

			await expect(
				toolJobQueries.deleteToolJob(nonExistentId),
			).rejects.toThrow();
		},
		TEST_TIMEOUT,
	);

	it(
		"does not affect other jobs when deleting",
		async () => {
			if (!harness) throw new Error("Test harness not initialized");

			// Create multiple jobs
			const job1 = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article1" },
				sessionId: `test-session-1-${Date.now()}`,
			});

			const job2 = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article2" },
				sessionId: `test-session-2-${Date.now()}`,
			});

			const job3 = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article3" },
				sessionId: `test-session-3-${Date.now()}`,
			});

			// Delete job2
			await toolJobQueries.deleteToolJob(job2.id);

			// Verify job2 is deleted
			const deletedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job2.id },
			});
			expect(deletedJob).toBeNull();

			// Verify job1 and job3 still exist
			const remainingJob1 = await harness.prisma.toolJob.findUnique({
				where: { id: job1.id },
			});
			const remainingJob3 = await harness.prisma.toolJob.findUnique({
				where: { id: job3.id },
			});

			expect(remainingJob1).toBeDefined();
			expect(remainingJob3).toBeDefined();
		},
		TEST_TIMEOUT,
	);
});
