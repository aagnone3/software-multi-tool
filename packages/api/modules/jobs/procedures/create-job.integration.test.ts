import { createToolJob, db } from "@repo/database";
import { afterAll, describe, expect, it } from "vitest";
import { processNextJob } from "../lib/job-runner";
import { registerProcessor } from "../lib/processor-registry";

describe("createJob integration", () => {
	// Clean up test jobs
	afterAll(async () => {
		await db.toolJob.deleteMany({
			where: { toolSlug: "test-tool-integration" },
		});
	});

	it("processes job successfully via job runner", async () => {
		// Register a test processor
		registerProcessor("test-tool-integration", async (job) => {
			return {
				success: true,
				output: { processed: true, inputEcho: job.input },
			};
		});

		// Create job directly
		const job = await createToolJob({
			toolSlug: "test-tool-integration",
			input: { testData: "integration-test" },
			sessionId: `test-session-${Date.now()}`,
		});

		expect(job).toBeDefined();
		expect(job?.status).toBe("PENDING");

		// Process the job
		const result = await processNextJob("test-tool-integration");

		expect(result.processed).toBe(true);
		expect(result.jobId).toBe(job?.id);

		// Verify job was completed
		const updatedJob = await db.toolJob.findUnique({
			where: { id: job?.id },
		});

		expect(updatedJob?.status).toBe("COMPLETED");
		expect(updatedJob?.output).toEqual({
			processed: true,
			inputEcho: { testData: "integration-test" },
		});
	});
});
