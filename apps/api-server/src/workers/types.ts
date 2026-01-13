/**
 * Payload sent to pg-boss jobs
 *
 * We store the actual job data in the ToolJob table,
 * and only send the reference ID to pg-boss.
 * This keeps pg-boss lightweight and allows us to
 * maintain our own job metadata.
 */
export interface JobPayload {
	/**
	 * Reference to the ToolJob record in our database
	 */
	toolJobId: string;
}

/**
 * Configuration for pg-boss workers
 */
export interface WorkerConfig {
	/**
	 * Number of jobs to fetch at once per queue
	 * Default: 5
	 */
	batchSize: number;

	/**
	 * How often to poll for new jobs (in seconds)
	 * Default: 2
	 */
	pollingIntervalSeconds: number;
}
