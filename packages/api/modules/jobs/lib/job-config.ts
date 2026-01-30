/**
 * Centralized job queue configuration
 *
 * This module provides a single source of truth for all job-related timeouts
 * and configuration. All modules should import these values rather than
 * defining their own to ensure consistency.
 *
 * ## Architecture (Inngest-based)
 *
 * Jobs are processed via Inngest functions in apps/web/inngest/:
 * - Job creation: packages/api/modules/jobs/procedures/create-job.ts
 * - Job processing: apps/web/inngest/functions/
 * - Maintenance: apps/web/app/api/cron/job-maintenance/route.ts
 *
 * ## Timeout Mechanisms
 *
 * 1. **Inngest Step Timeout**: Each Inngest step can run up to 2 hours.
 *    Long-running jobs use multiple steps to stay within limits.
 *
 * 2. **Stuck Job Cleanup** (`STUCK_JOB_TIMEOUT_MINUTES`): The cron maintenance
 *    job marks ToolJob records as FAILED if they've been PROCESSING too long.
 *    This is a fallback for edge cases where Inngest doesn't update status.
 *
 * ## Retry Strategy
 *
 * Inngest handles retries with exponential backoff:
 * - Default 3 retry attempts
 * - Exponential backoff between retries
 * - After all retries exhausted, the job is marked permanently failed.
 */

/**
 * Job processing timeout in milliseconds.
 *
 * This is the maximum time a job processor can run before being considered
 * stuck. Used by the stuck job cleanup mechanism.
 *
 * @default 600000 (10 minutes)
 */
export const JOB_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Job processing timeout in seconds.
 *
 * Same as JOB_TIMEOUT_MS but in seconds.
 *
 * @default 600 (10 minutes)
 */
export const JOB_TIMEOUT_SECONDS = JOB_TIMEOUT_MS / 1000;

/**
 * Stuck job cleanup timeout in minutes.
 *
 * Used by the cron maintenance job to mark ToolJob records as FAILED
 * if they've been in PROCESSING status longer than this duration.
 *
 * Set higher than JOB_TIMEOUT_SECONDS to allow Inngest retries to
 * complete first, avoiding duplicate state transitions.
 *
 * @default 30 (30 minutes - 3x the job timeout)
 */
export const STUCK_JOB_TIMEOUT_MINUTES = 30;

/**
 * Inngest retry configuration
 * Note: These values are for reference. Actual retry config is in each
 * Inngest function definition in apps/web/inngest/functions/
 */
export const RETRY_CONFIG = {
	/**
	 * Maximum number of retry attempts.
	 * After this many failures, the job is permanently failed.
	 */
	limit: 3,

	/**
	 * Initial retry delay in seconds.
	 * With exponential backoff: 60s → 120s → 240s → 480s (doubling).
	 */
	delay: 60,

	/**
	 * Enable exponential backoff.
	 * Each retry delay doubles: delay * 2^retryCount (plus jitter).
	 */
	backoff: true,
} as const;
