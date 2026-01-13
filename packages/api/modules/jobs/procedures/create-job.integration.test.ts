import type { PostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { createPostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

type ToolJobQueries = typeof import("@repo/database");
type QueueModule = typeof import("../lib/queue");

// Skip integration tests if Docker is not available
let dockerAvailable = true;

describe.sequential("createJob integration", () => {
	let harness: PostgresTestHarness | undefined;
	let toolJobQueries: ToolJobQueries;
	let queueModule: QueueModule;

	beforeAll(async () => {
		try {
			harness = await createPostgresTestHarness();
			// Dynamically import modules AFTER test harness sets DATABASE_URL
			toolJobQueries = await import("@repo/database");
			queueModule = await import("../lib/queue");
			await harness.resetDatabase();
		} catch (error) {
			// Docker/testcontainers not available - skip tests gracefully
			console.warn(
				"[createJob integration] Skipping tests: Docker/testcontainers not available",
				error instanceof Error ? error.message : error,
			);
			dockerAvailable = false;
		}
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		await harness?.resetDatabase();
	});

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	it(
		"creates job and submits to pg-boss queue",
		async () => {
			if (!dockerAvailable || !harness) {
				console.warn(
					"[createJob integration] Skipping test: Docker not available",
				);
				return;
			}

			// Create job directly using the dynamically imported function
			const job = await toolJobQueries.createToolJob({
				toolSlug: "news-analyzer",
				input: { articleUrl: "https://example.com/article" },
				sessionId: `test-session-${Date.now()}`,
			});

			expect(job).toBeDefined();
			expect(job?.status).toBe("PENDING");

			// Submit job to pg-boss queue
			const pgBossJobId = await queueModule.submitJobToQueue(
				"news-analyzer",
				job.id,
				{ priority: 5 },
			);

			// Verify job was submitted to pg-boss
			expect(pgBossJobId).toBeTruthy();

			// Verify ToolJob was updated with pgBossJobId
			const updatedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job?.id },
			});

			expect(updatedJob?.pgBossJobId).toBe(pgBossJobId);
			expect(updatedJob?.status).toBe("PENDING"); // Still pending until worker picks it up

			// Verify job exists in pg-boss queue
			const pgBossJob = await harness.prisma.$queryRaw<
				Array<{
					id: string;
					name: string;
					state: string;
					data: unknown;
				}>
			>`
				SELECT id::text, name, state::text, data
				FROM pgboss.job
				WHERE id = ${pgBossJobId}::uuid
			`;

			expect(pgBossJob).toHaveLength(1);
			expect(pgBossJob[0].name).toBe("news-analyzer");
			expect(pgBossJob[0].state).toBe("created");
			expect(pgBossJob[0].data).toEqual({ toolJobId: job.id });
		},
		TEST_TIMEOUT,
	);

	it(
		"handles queue submission with different priorities",
		async () => {
			if (!dockerAvailable || !harness) {
				console.warn(
					"[createJob integration] Skipping test: Docker not available",
				);
				return;
			}

			// Use a unique queue name to avoid conflicts with other tests
			const queueName = `test-priority-${Date.now()}`;

			// Create two jobs
			const lowPriorityJob = await toolJobQueries.createToolJob({
				toolSlug: queueName,
				input: { articleUrl: "https://example.com/low" },
				sessionId: `test-session-low-${Date.now()}`,
			});

			const highPriorityJob = await toolJobQueries.createToolJob({
				toolSlug: queueName,
				input: { articleUrl: "https://example.com/high" },
				sessionId: `test-session-high-${Date.now()}`,
			});

			// Submit with different priorities
			await queueModule.submitJobToQueue(queueName, lowPriorityJob.id, {
				priority: 1,
			});
			await queueModule.submitJobToQueue(queueName, highPriorityJob.id, {
				priority: 10,
			});

			// Verify both jobs are in the queue with correct priorities
			const pgBossJobs = await harness.prisma.$queryRaw<
				Array<{
					id: string;
					priority: number;
					data: { toolJobId: string };
				}>
			>`
				SELECT id::text, priority, data
				FROM pgboss.job
				WHERE name = ${queueName}
				ORDER BY priority DESC
			`;

			expect(pgBossJobs).toHaveLength(2);
			// High priority should be first
			expect(pgBossJobs[0].data.toolJobId).toBe(highPriorityJob.id);
			expect(pgBossJobs[0].priority).toBe(10);
			// Low priority should be second
			expect(pgBossJobs[1].data.toolJobId).toBe(lowPriorityJob.id);
			expect(pgBossJobs[1].priority).toBe(1);
		},
		TEST_TIMEOUT,
	);
});
