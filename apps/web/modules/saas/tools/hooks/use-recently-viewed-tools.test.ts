import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecentlyViewedTools } from "./use-recently-viewed-tools";

describe("useRecentlyViewedTools", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it("returns empty list when nothing stored", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());
		expect(result.current.recentTools).toEqual([]);
	});

	it("records a view and stores it", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());

		act(() => {
			result.current.recordView("news-analyzer");
		});

		expect(result.current.recentTools).toHaveLength(1);
		expect(result.current.recentTools[0].slug).toBe("news-analyzer");
	});

	it("moves existing slug to front on re-view", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());

		act(() => {
			result.current.recordView("tool-a");
		});
		act(() => {
			result.current.recordView("tool-b");
		});
		act(() => {
			result.current.recordView("tool-a");
		});

		expect(result.current.recentTools[0].slug).toBe("tool-a");
		expect(result.current.recentTools).toHaveLength(2);
	});

	it("caps list at 5 items", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());

		for (let i = 0; i < 7; i++) {
			act(() => {
				result.current.recordView(`tool-${i}`);
			});
		}

		expect(result.current.recentTools).toHaveLength(5);
	});

	it("persists to localStorage", () => {
		const { result } = renderHook(() => useRecentlyViewedTools());

		act(() => {
			result.current.recordView("contract-analyzer");
		});

		const stored = JSON.parse(
			localStorage.getItem("recently-viewed-tools") ?? "[]",
		);
		expect(stored[0].slug).toBe("contract-analyzer");
	});

	it("loads persisted items on mount", () => {
		localStorage.setItem(
			"recently-viewed-tools",
			JSON.stringify([
				{
					slug: "expense-categorizer",
					viewedAt: new Date().toISOString(),
				},
			]),
		);

		const { result } = renderHook(() => useRecentlyViewedTools());

		// items are loaded in a useEffect, so after the initial render they appear
		expect(result.current.recentTools).toHaveLength(1);
	});
});
