import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockJobsStream = vi.hoisted(() => vi.fn());

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		jobs: {
			stream: mockJobsStream,
		},
	},
}));

import { useJobStream } from "./use-job-stream";

function makeJob(overrides: Record<string, unknown> = {}) {
	return {
		id: "job-1",
		toolSlug: "test-tool",
		status: "PENDING",
		priority: 0,
		input: {},
		output: null,
		error: null,
		userId: null,
		sessionId: null,
		attempts: 0,
		maxAttempts: 3,
		startedAt: null,
		completedAt: null,
		expiresAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

async function* makeIterator(events: Array<Record<string, unknown>>) {
	for (const event of events) {
		yield event;
	}
}

describe("useJobStream", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts with null job and loading state when jobId is provided", async () => {
		mockJobsStream.mockResolvedValue(makeIterator([]));

		const { result } = renderHook(() => useJobStream("job-1"));

		expect(result.current.job).toBeNull();
		expect(result.current.isLoading).toBe(true);
		expect(result.current.isStreaming).toBe(true);
	});

	it("returns null job and isLoading=false when no jobId", () => {
		const { result } = renderHook(() => useJobStream(undefined));

		expect(result.current.job).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isStreaming).toBe(true);
	});

	it("updates job state on stream update event", async () => {
		const job = makeJob({ status: "RUNNING" });
		mockJobsStream.mockResolvedValue(
			makeIterator([{ type: "update", job }]),
		);

		const { result } = renderHook(() => useJobStream("job-1"));

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.job).toEqual(job);
		expect(result.current.isLoading).toBe(false);
	});

	it("stops streaming on terminal COMPLETED status", async () => {
		const job = makeJob({ status: "COMPLETED" });
		mockJobsStream.mockResolvedValue(
			makeIterator([{ type: "update", job }]),
		);

		const { result } = renderHook(() => useJobStream("job-1"));

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.job?.status).toBe("COMPLETED");
		// Stream should have stopped after terminal state
		expect(mockJobsStream).toHaveBeenCalledTimes(1);
	});

	it("stops streaming on terminal FAILED status", async () => {
		const job = makeJob({
			status: "FAILED",
			error: "Something went wrong",
		});
		mockJobsStream.mockResolvedValue(
			makeIterator([{ type: "update", job }]),
		);

		const { result } = renderHook(() => useJobStream("job-1"));

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.job?.status).toBe("FAILED");
	});

	it("falls back to polling after max reconnect attempts", async () => {
		mockJobsStream.mockRejectedValue(new Error("Connection failed"));

		const { result } = renderHook(() => useJobStream("job-1"));

		// Run timers to trigger all retry backoffs (5 retries: 1s, 2s, 4s, 8s, 10s)
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		// After max attempts, isStreaming should be false
		expect(result.current.isStreaming).toBe(false);
		expect(result.current.error).toBeTruthy();
	});

	it("reconnects with exponential backoff on stream error", async () => {
		let callCount = 0;
		mockJobsStream.mockImplementation(async () => {
			callCount++;
			if (callCount <= 2) {
				throw new Error("Temporary error");
			}
			const job = makeJob({ status: "COMPLETED" });
			return makeIterator([{ type: "update", job }]);
		});

		renderHook(() => useJobStream("job-1"));

		// First call happens immediately
		await act(async () => {
			await vi.advanceTimersByTimeAsync(100);
		});
		expect(callCount).toBe(1);

		// Second call after 1s backoff
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1500);
		});
		expect(callCount).toBe(2);

		// Third call after 2s backoff — succeeds with COMPLETED job
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(callCount).toBe(3);
	});

	it("resets state on jobId change", async () => {
		const job1 = makeJob({ id: "job-1", status: "RUNNING" });
		const job2 = makeJob({ id: "job-2", status: "PENDING" });

		mockJobsStream
			.mockResolvedValueOnce(
				makeIterator([{ type: "update", job: job1 }]),
			)
			.mockResolvedValueOnce(
				makeIterator([{ type: "update", job: job2 }]),
			);

		const { result, rerender } = renderHook(
			({ jobId }) => useJobStream(jobId),
			{ initialProps: { jobId: "job-1" as string | undefined } },
		);

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		rerender({ jobId: "job-2" });

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.job?.id).toBe("job-2");
	});
});
