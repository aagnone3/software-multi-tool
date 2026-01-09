"use client";

import { useJobPolling } from "./use-job-polling";
import { useJobStream } from "./use-job-stream";

/**
 * Unified hook for job updates with progressive enhancement.
 * Uses SSE streaming when available, falls back to polling if not supported
 * or if streaming fails.
 */
export function useJobUpdates(jobId: string | undefined) {
	const streamResult = useJobStream(jobId);
	const pollingResult = useJobPolling(
		// Only enable polling if streaming is not active
		streamResult.isStreaming ? undefined : jobId,
	);

	// Use streaming if supported and active
	if (streamResult.isStreaming) {
		return {
			job: streamResult.job,
			isLoading: streamResult.isLoading,
			error: streamResult.error,
			// Provide stubs for polling-specific methods
			refetch: () => Promise.resolve(),
			invalidateJob: () => {},
		};
	}

	// Fall back to polling
	return pollingResult;
}
