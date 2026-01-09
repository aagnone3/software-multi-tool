"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useCallback, useEffect, useRef, useState } from "react";

interface Job {
	id: string;
	toolSlug: string;
	status: string;
	priority: number;
	input: Record<string, unknown>;
	output: Record<string, unknown> | null;
	error: string | null;
	userId: string | null;
	sessionId: string | null;
	attempts: number;
	maxAttempts: number;
	startedAt: Date | null;
	completedAt: Date | null;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface StreamEvent {
	type: "update" | "timeout";
	job?: Job;
}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

/**
 * Hook for consuming job updates via SSE streaming.
 * Returns isStreaming: false if streaming is not available or not supported.
 */
export function useJobStream(jobId: string | undefined) {
	const [job, setJob] = useState<Job | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isStreaming, setIsStreaming] = useState(true);

	const abortControllerRef = useRef<AbortController | null>(null);
	const reconnectAttemptRef = useRef(0);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isTerminalRef = useRef(false);

	const connectStream = useCallback(async () => {
		if (!jobId) {
			return;
		}

		// Don't reconnect if we've reached a terminal state
		if (isTerminalRef.current) {
			return;
		}

		// Cancel any existing connection
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			setIsLoading(true);
			setError(null);

			// Call the streaming endpoint
			const iterator = await orpcClient.jobs.stream(
				{ jobId },
				{ signal: abortController.signal },
			);

			// Consume the async iterator
			for await (const event of iterator as AsyncIterable<StreamEvent>) {
				// Check if aborted
				if (abortController.signal.aborted) {
					break;
				}

				if (event.type === "update" && event.job) {
					setJob(event.job);
					setIsLoading(false);
					reconnectAttemptRef.current = 0; // Reset on successful update

					// Check for terminal state
					if (TERMINAL_STATUSES.includes(event.job.status)) {
						isTerminalRef.current = true;
						return;
					}
				} else if (event.type === "timeout") {
					// Server is signaling timeout, schedule immediate reconnect
					// Use setTimeout(0) to break out of the async iteration cleanly
					setTimeout(() => connectStream(), 0);
					return;
				}
			}
		} catch (err) {
			// Don't process errors if we aborted intentionally
			if (abortController.signal.aborted) {
				return;
			}

			// Don't reconnect if already in terminal state
			if (isTerminalRef.current) {
				return;
			}

			setIsLoading(false);

			// Handle reconnection with exponential backoff
			if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
				const delay = Math.min(
					INITIAL_BACKOFF_MS * 2 ** reconnectAttemptRef.current,
					MAX_BACKOFF_MS,
				);
				reconnectAttemptRef.current++;

				reconnectTimeoutRef.current = setTimeout(
					() => connectStream(),
					delay,
				);
			} else {
				// Max attempts reached, fall back to polling
				setError(
					err instanceof Error
						? err
						: new Error("Stream connection failed"),
				);
				setIsStreaming(false);
			}
		}
	}, [jobId]);

	useEffect(() => {
		if (!jobId) {
			setJob(null);
			setIsLoading(false);
			setError(null);
			return;
		}

		// Reset all state for new jobId
		isTerminalRef.current = false;
		reconnectAttemptRef.current = 0;
		setIsStreaming(true);
		setError(null);

		connectStream();

		return () => {
			// Cleanup on unmount or jobId change
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- connectStream is stable for a given jobId
	}, [jobId]);

	return {
		job,
		isLoading,
		error,
		isStreaming,
	};
}
