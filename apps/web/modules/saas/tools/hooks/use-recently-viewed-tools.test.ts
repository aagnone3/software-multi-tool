import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type RecentlyViewedTool,
	useRecentlyViewedTools,
} from "./use-recently-viewed-tools";

const STORAGE_KEY = "recently-viewed-tools";

describe("useRecentlyViewedTools", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts with empty list when localStorage is empty", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());
		// After useEffect runs
		act(() => {});
		expect(result.current.recentTools).toEqual([]);
	});

	it("loads existing entries from localStorage", () => {
		const existing: RecentlyViewedTool[] = [
			{ slug: "news-analyzer", viewedAt: "2026-03-22T10:00:00Z" },
		];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {});
		expect(result.current.recentTools).toEqual(existing);
	});

	it("recordView adds a new entry at the front", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {
			result.current.recordView("invoice-processor");
		});
		expect(result.current.recentTools[0].slug).toBe("invoice-processor");
	});

	it("recordView deduplicates entries (moves existing to front)", () => {
		const existing: RecentlyViewedTool[] = [
			{ slug: "news-analyzer", viewedAt: "2026-03-22T10:00:00Z" },
			{ slug: "invoice-processor", viewedAt: "2026-03-22T09:00:00Z" },
		];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {});
		act(() => {
			result.current.recordView("invoice-processor");
		});
		expect(result.current.recentTools[0].slug).toBe("invoice-processor");
		expect(result.current.recentTools[1].slug).toBe("news-analyzer");
		expect(result.current.recentTools).toHaveLength(2);
	});

	it("caps list at 5 items", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {});
		for (const slug of ["a", "b", "c", "d", "e", "f"]) {
			act(() => {
				result.current.recordView(slug);
			});
		}
		expect(result.current.recentTools).toHaveLength(5);
		expect(result.current.recentTools[0].slug).toBe("f");
	});

	it("persists to localStorage after recordView", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {
			result.current.recordView("feedback-analyzer");
		});
		const stored = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? "[]",
		) as RecentlyViewedTool[];
		expect(stored[0].slug).toBe("feedback-analyzer");
	});

	it("gracefully handles corrupt localStorage data", () => {
		localStorage.setItem(STORAGE_KEY, "not-json");
		const { result } = renderHook(() => useRecentlyViewedTools());
		act(() => {});
		expect(result.current.recentTools).toEqual([]);
	});
});
