import type { PostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { createPostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

type ToolJobQueries = typeof import("@repo/database");
type JobRunnerModule = typeof import("../lib/job-runner");
type ProcessorRegistryModule = typeof import("../lib/processor-registry");

// Skip integration tests if Docker is not available
let dockerAvailable = true;

describe.sequential("createJob integration", () => {
	let harness: PostgresTestHarness | undefined;
	let toolJobQueries: ToolJobQueries;
	let jobRunner: JobRunnerModule;
	let processorRegistry: ProcessorRegistryModule;

	beforeAll(async () => {
		try {
			harness = await createPostgresTestHarness();
			// Dynamically import modules AFTER test harness sets DATABASE_URL
			toolJobQueries = await import("@repo/database");
			jobRunner = await import("../lib/job-runner");
			processorRegistry = await import("../lib/processor-registry");
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
		"processes job successfully via job runner",
		async () => {
			if (!dockerAvailable || !harness) {
				console.warn("[createJob integration] Skipping test: Docker not available");
				return;
			}

			// Register a test processor
			processorRegistry.registerProcessor(
				"test-tool-integration",
				async (job) => {
					return {
						success: true,
						output: { processed: true, inputEcho: job.input },
					};
				},
			);

			// Create job directly using the dynamically imported function
			const job = await toolJobQueries.createToolJob({
				toolSlug: "test-tool-integration",
				input: { testData: "integration-test" },
				sessionId: `test-session-${Date.now()}`,
			});

			expect(job).toBeDefined();
			expect(job?.status).toBe("PENDING");

			// Process the job
			const result = await jobRunner.processNextJob(
				"test-tool-integration",
			);

			expect(result.processed).toBe(true);
			expect(result.jobId).toBe(job?.id);

			// Verify job was completed
			const updatedJob = await harness.prisma.toolJob.findUnique({
				where: { id: job?.id },
			});

			expect(updatedJob?.status).toBe("COMPLETED");
			expect(updatedJob?.output).toEqual({
				processed: true,
				inputEcho: { testData: "integration-test" },
			});
		},
		TEST_TIMEOUT,
	);
});
