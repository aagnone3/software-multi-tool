import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useJobUpdates } from "./use-job-updates";

const mockStreamResult = vi.hoisted(() => ({
	job: null as null | { id: string; status: string },
	isLoading: false,
	error: null,
	isStreaming: true,
}));

const mockPollingResult = vi.hoisted(() => ({
	job: null as null | { id: string; status: string },
	isLoading: false,
	error: null,
	refetch: vi.fn(),
	invalidateJob: vi.fn(),
}));

vi.mock("./use-job-stream", () => ({
	useJobStream: () => mockStreamResult,
}));

vi.mock("./use-job-polling", () => ({
	useJobPolling: () => mockPollingResult,
}));

describe("useJobUpdates", () => {
	it("returns streaming result when streaming is active", () => {
		mockStreamResult.isStreaming = true;
		mockStreamResult.job = { id: "job-1", status: "PROCESSING" };

		const { result } = renderHook(() => useJobUpdates("job-1"));

		expect(result.current.job).toEqual({
			id: "job-1",
			status: "PROCESSING",
		});
	});

	it("falls back to polling when streaming is not active", () => {
		mockStreamResult.isStreaming = false;
		mockPollingResult.job = { id: "job-2", status: "COMPLETED" };

		const { result } = renderHook(() => useJobUpdates("job-2"));

		expect(result.current.job).toEqual({
			id: "job-2",
			status: "COMPLETED",
		});
		expect(result.current.refetch).toBeDefined();
		expect(result.current.invalidateJob).toBeDefined();
	});

	it("stub refetch resolves when in streaming mode", async () => {
		mockStreamResult.isStreaming = true;

		const { result } = renderHook(() => useJobUpdates("job-3"));

		await expect(result.current.refetch()).resolves.toBeUndefined();
	});

	it("stub invalidateJob does nothing when in streaming mode", () => {
		mockStreamResult.isStreaming = true;

		const { result } = renderHook(() => useJobUpdates("job-3"));

		expect(() => result.current.invalidateJob()).not.toThrow();
	});
});
