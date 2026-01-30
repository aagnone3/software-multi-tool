import { logger } from "@repo/logs";

/**
 * Job queue abstraction (Inngest migration)
 *
 * This module previously provided pg-boss queue submission.
 * Job processing is now handled by Inngest functions in apps/web/inngest/.
 *
 * Architecture:
 * - create-job.ts creates a ToolJob record
 * - Inngest event is sent to trigger the appropriate function
 * - Inngest functions poll and process jobs asynchronously
 *
 * This file is kept for backwards compatibility with any code that may
 * still reference these functions, but they now return no-ops.
 */

interface SubmitJobOptions {
	/**
	 * Job priority (higher = processed first)
	 * @default 0
	 */
	priority?: number;

	/**
	 * When to start processing the job
	 * @default now
	 */
	startAfter?: Date;

	/**
	 * Job expiration interval (PostgreSQL interval format).
	 * @default "10 minutes"
	 */
	expireIn?: string;

	/**
	 * Singleton key for deduplication
	 */
	singletonKey?: string;
}

/**
 * @deprecated pg-boss queue has been replaced by Inngest.
 * Jobs are now triggered via Inngest events. This function is a no-op.
 */
export async function submitJobToQueue(
	queueName: string,
	toolJobId: string,
	_options: SubmitJobOptions = {},
): Promise<string | null> {
	logger.warn(
		`[DEPRECATED] submitJobToQueue() called for queue=${queueName}, toolJobId=${toolJobId}. ` +
			"Job submission is now handled by Inngest events.",
	);
	return null;
}

/**
 * @deprecated pg-boss has been removed. This function is a no-op.
 */
export async function arePgBossWorkersActive(): Promise<boolean> {
	logger.warn(
		"[DEPRECATED] arePgBossWorkersActive() called. pg-boss has been removed.",
	);
	return false;
}
