/**
 * Controllable test processors for job lifecycle integration tests
 *
 * These processors allow testing different job scenarios:
 * - successProcessor: Always succeeds (happy path)
 * - retryProcessor: Fails N times then succeeds (retry path)
 * - hangProcessor: Never completes (expiration path)
 *
 * Each processor can be registered with pg-boss for specific test queues.
 */

import type { ToolJob } from "@repo/database";
import type { JobResult } from "../lib/processor-registry";

/**
 * Track attempt counts per job ID
 * This survives across pg-boss retry cycles
 */
const attemptTracker = new Map<string, number>();

/**
 * Reset the attempt tracker between tests
 */
export function resetAttemptTracker(): void {
	attemptTracker.clear();
}

/**
 * Get the current attempt count for a job
 */
export function getAttemptCount(jobId: string): number {
	return attemptTracker.get(jobId) ?? 0;
}

/**
 * Processor that always succeeds immediately
 * Use for happy path testing
 */
export async function successProcessor(job: ToolJob): Promise<JobResult> {
	return {
		success: true,
		output: {
			processed: true,
			jobId: job.id,
			timestamp: new Date().toISOString(),
		},
	};
}

/**
 * Processor that fails a configurable number of times before succeeding
 * Use for retry path testing
 *
 * Input format:
 * - failCount: number of times to fail before succeeding (default: 1)
 */
export async function retryProcessor(job: ToolJob): Promise<JobResult> {
	const input = job.input as { failCount?: number } | null;
	const failCount = input?.failCount ?? 1;

	// Increment attempt count
	const attempts = (attemptTracker.get(job.id) ?? 0) + 1;
	attemptTracker.set(job.id, attempts);

	if (attempts <= failCount) {
		// Fail this attempt - throw to trigger pg-boss retry
		throw new Error(
			`Intentional failure (attempt ${attempts}/${failCount + 1})`,
		);
	}

	// Success after all failures
	return {
		success: true,
		output: {
			processed: true,
			jobId: job.id,
			totalAttempts: attempts,
			timestamp: new Date().toISOString(),
		},
	};
}

/**
 * Processor that always fails
 * Use for testing retry exhaustion
 */
export async function alwaysFailProcessor(job: ToolJob): Promise<JobResult> {
	// Increment attempt count for tracking
	const attempts = (attemptTracker.get(job.id) ?? 0) + 1;
	attemptTracker.set(job.id, attempts);

	throw new Error(`Intentional permanent failure (attempt ${attempts})`);
}

/**
 * Processor that hangs indefinitely (until timeout)
 * Use for expiration path testing
 *
 * Note: This processor never resolves, simulating a stuck job.
 * The test should use a short expiration timeout.
 */
export async function hangProcessor(_job: ToolJob): Promise<JobResult> {
	// Return a promise that never resolves
	return new Promise<JobResult>(() => {
		// Intentionally never resolves
	});
}

/**
 * Processor that takes a configurable amount of time
 * Use for timing-sensitive tests
 *
 * Input format:
 * - delayMs: milliseconds to wait before completing (default: 100)
 */
export async function delayProcessor(job: ToolJob): Promise<JobResult> {
	const input = job.input as { delayMs?: number } | null;
	const delayMs = input?.delayMs ?? 100;

	await new Promise((resolve) => setTimeout(resolve, delayMs));

	return {
		success: true,
		output: {
			processed: true,
			jobId: job.id,
			delayMs,
			timestamp: new Date().toISOString(),
		},
	};
}

/**
 * Helper to create a processor that runs custom logic
 * Use for complex test scenarios
 */
export function createCustomProcessor(
	handler: (job: ToolJob) => Promise<JobResult>,
): (job: ToolJob) => Promise<JobResult> {
	return handler;
}
