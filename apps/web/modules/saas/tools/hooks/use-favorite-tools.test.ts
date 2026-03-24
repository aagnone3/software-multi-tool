import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFavoriteTools } from "./use-favorite-tools";

const storageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(globalThis, "localStorage", {
	value: storageMock,
	writable: true,
});

describe("useFavoriteTools", () => {
	beforeEach(() => {
		storageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		storageMock.clear();
	});

	it("starts with an empty favorites set when storage is empty", () => {
		const { result } = renderHook(() => useFavoriteTools());
		expect(result.current.favorites.size).toBe(0);
	});

	it("loads persisted favorites from localStorage on mount", () => {
		storageMock.setItem(
			"smt:favorite-tools",
			JSON.stringify(["tool-a", "tool-b"]),
		);
		const { result } = renderHook(() => useFavoriteTools());
		// wait for the useEffect
		expect(result.current.isFavorite("tool-a")).toBe(true);
		expect(result.current.isFavorite("tool-b")).toBe(true);
	});

	it("toggleFavorite adds a tool that is not yet favorited", () => {
		const { result } = renderHook(() => useFavoriteTools());
		act(() => {
			result.current.toggleFavorite("news-analyzer");
		});
		expect(result.current.isFavorite("news-analyzer")).toBe(true);
	});

	it("toggleFavorite removes a tool that is already favorited", () => {
		storageMock.setItem(
			"smt:favorite-tools",
			JSON.stringify(["news-analyzer"]),
		);
		const { result } = renderHook(() => useFavoriteTools());
		act(() => {
			result.current.toggleFavorite("news-analyzer");
		});
		expect(result.current.isFavorite("news-analyzer")).toBe(false);
	});

	it("persists the updated favorites to localStorage after toggle", () => {
		const { result } = renderHook(() => useFavoriteTools());
		act(() => {
			result.current.toggleFavorite("invoice-processor");
		});
		expect(storageMock.setItem).toHaveBeenCalledWith(
			"smt:favorite-tools",
			JSON.stringify(["invoice-processor"]),
		);
	});

	it("isFavorite returns false for unknown slugs", () => {
		const { result } = renderHook(() => useFavoriteTools());
		expect(result.current.isFavorite("does-not-exist")).toBe(false);
	});
});
