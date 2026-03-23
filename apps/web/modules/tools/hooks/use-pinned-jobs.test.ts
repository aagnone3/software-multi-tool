import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
	};
})();

vi.stubGlobal("localStorage", localStorageMock);

import { usePinnedJobs } from "./use-pinned-jobs";

describe("usePinnedJobs", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("starts with empty pinned jobs", () => {
		const { result } = renderHook(() => usePinnedJobs());
		expect(result.current.pinnedJobs).toEqual([]);
	});

	it("pins a job", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		expect(result.current.pinnedJobs).toHaveLength(1);
		expect(result.current.pinnedJobs[0].id).toBe("job-1");
	});

	it("does not duplicate pins", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		expect(result.current.pinnedJobs).toHaveLength(1);
	});

	it("unpins a job", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		act(() => {
			result.current.unpinJob("job-1");
		});
		expect(result.current.pinnedJobs).toHaveLength(0);
	});

	it("isPinned returns correct value", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		expect(result.current.isPinned("job-1")).toBe(true);
		expect(result.current.isPinned("job-2")).toBe(false);
	});

	it("updates note on pinned job", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		act(() => {
			result.current.updateNote("job-1", "Important analysis");
		});
		expect(result.current.pinnedJobs[0].note).toBe("Important analysis");
	});

	it("persists to localStorage", () => {
		const { result } = renderHook(() => usePinnedJobs());
		act(() => {
			result.current.pinJob({
				id: "job-1",
				toolSlug: "news-analyzer",
				toolName: "News Analyzer",
			});
		});
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"pinned-jobs",
			expect.any(String),
		);
	});
});
