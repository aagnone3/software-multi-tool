/**
 * Centralized job queue configuration
 *
 * This module provides a single source of truth for all job-related timeouts
 * and retry configuration. All modules should import these values rather than
 * defining their own to ensure consistency.
 *
 * ## Timeout Architecture
 *
 * Jobs have multiple timeout mechanisms that work together:
 *
 * 1. **Application Timeout** (`JOB_TIMEOUT_MS`): The processor wrapper uses
 *    `withTimeout()` to kill long-running job handlers. This prevents
 *    indefinite hangs in user code.
 *
 * 2. **pg-boss Expiration** (`JOB_EXPIRE_IN_SECONDS`): pg-boss marks jobs as
 *    "expired" if they stay in "active" state too long. This catches cases
 *    where the worker dies without completing/failing the job.
 *
 * 3. **Stuck Job Cleanup** (`STUCK_JOB_TIMEOUT_MINUTES`): The cron maintenance
 *    job marks ToolJob records as FAILED if they've been PROCESSING too long.
 *    This is a fallback for state divergence between pg-boss and ToolJob.
 *
 * ## Timeout Hierarchy
 *
 * ```
 * Application Timeout (10 min)
 *    ↓ triggers
 * Job handler throws TimeoutError
 *    ↓ caught by
 * Worker marks ToolJob FAILED + pg-boss fail()
 *
 * If worker dies before completion:
 *    ↓
 * pg-boss Expiration (10 min from start)
 *    ↓ triggers
 * onExpire handler marks ToolJob EXPIRED
 *
 * If pg-boss also fails:
 *    ↓
 * Stuck Job Cleanup (30 min cron)
 *    ↓ marks
 * ToolJob FAILED with "Job timed out"
 * ```
 *
 * ## Retry Strategy
 *
 * pg-boss handles retries with exponential backoff:
 * - `retryLimit: 3` - Maximum 3 retry attempts
 * - `retryDelay: 60` - Initial delay of 60 seconds
 * - `retryBackoff: true` - Exponential backoff (delay² for each retry)
 *
 * Retry timeline for a failing job:
 * - Attempt 1: Immediate
 * - Attempt 2: After 60 seconds (1 minute)
 * - Attempt 3: After 3600 seconds (1 hour) - 60²
 * - Attempt 4: After 12960000 seconds (would be ~150 days, but hits retryLimit)
 *
 * After all retries exhausted, the job is marked permanently failed.
 */

/**
 * Job processing timeout in milliseconds.
 *
 * This is the maximum time a job processor can run before being forcibly
 * terminated. Applied via `withTimeout()` wrapper in worker code.
 *
 * @default 600000 (10 minutes)
 */
export const JOB_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Job processing timeout in seconds.
 *
 * Same as JOB_TIMEOUT_MS but in seconds for pg-boss configuration.
 *
 * @default 600 (10 minutes)
 */
export const JOB_TIMEOUT_SECONDS = JOB_TIMEOUT_MS / 1000;

/**
 * pg-boss job expiration interval.
 *
 * Format: PostgreSQL interval string (HH:MM:SS).
 * Jobs are marked as "expired" if they stay in "active" state longer than this.
 *
 * @default "00:10:00" (10 minutes)
 */
export const JOB_EXPIRE_IN_INTERVAL = "00:10:00";

/**
 * Stuck job cleanup timeout in minutes.
 *
 * Used by the cron maintenance job to mark ToolJob records as FAILED
 * if they've been in PROCESSING status longer than this duration.
 *
 * Set higher than JOB_TIMEOUT_SECONDS to allow pg-boss expiration to
 * trigger first, avoiding duplicate state transitions.
 *
 * @default 30 (30 minutes - 3x the job timeout)
 */
export const STUCK_JOB_TIMEOUT_MINUTES = 30;

/**
 * pg-boss retry configuration
 */
export const RETRY_CONFIG = {
	/**
	 * Maximum number of retry attempts.
	 * After this many failures, the job is permanently failed.
	 */
	limit: 3,

	/**
	 * Initial retry delay in seconds.
	 * With exponential backoff: 60s, 3600s (~1hr), etc.
	 */
	delay: 60,

	/**
	 * Enable exponential backoff.
	 * Each retry delay = previous delay²
	 */
	backoff: true,
} as const;

/**
 * Archive configuration for completed/failed jobs
 */
export const ARCHIVE_CONFIG = {
	/**
	 * Archive completed jobs after this many seconds.
	 * @default 604800 (7 days)
	 */
	completedAfterSeconds: 60 * 60 * 24 * 7,

	/**
	 * Archive failed jobs after this many seconds.
	 * @default 1209600 (14 days)
	 */
	failedAfterSeconds: 60 * 60 * 24 * 14,
} as const;

/**
 * Worker polling configuration
 */
export const WORKER_CONFIG = {
	/**
	 * Number of jobs to fetch per poll.
	 */
	batchSize: 5,

	/**
	 * How often to poll for new jobs (seconds).
	 */
	pollingIntervalSeconds: 2,

	/**
	 * Monitor state interval (seconds).
	 * How often pg-boss reports queue statistics.
	 */
	monitorStateIntervalSeconds: 30,
} as const;
