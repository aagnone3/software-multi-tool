import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToolRatings } from "./use-tool-ratings";

describe("useToolRatings", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns null rating for unrated tool", () => {
		const { result } = renderHook(() => useToolRatings());
		expect(result.current.getRating("some-tool")).toBeNull();
	});

	it("rates a tool and persists to localStorage", () => {
		const { result } = renderHook(() => useToolRatings());
		act(() => {
			result.current.rateTool("test-tool", 4);
		});
		expect(result.current.getRating("test-tool")).toBe(4);
		const stored = JSON.parse(localStorage.getItem("tool-ratings") ?? "{}");
		expect(stored["test-tool"]).toBe(4);
	});

	it("overwrites an existing rating", () => {
		const { result } = renderHook(() => useToolRatings());
		act(() => {
			result.current.rateTool("test-tool", 3);
		});
		act(() => {
			result.current.rateTool("test-tool", 5);
		});
		expect(result.current.getRating("test-tool")).toBe(5);
	});

	it("reads existing ratings from localStorage on mount", () => {
		localStorage.setItem("tool-ratings", JSON.stringify({ "my-tool": 2 }));
		const { result } = renderHook(() => useToolRatings());
		expect(result.current.getRating("my-tool")).toBe(2);
	});

	it("handles corrupted localStorage gracefully", () => {
		localStorage.setItem("tool-ratings", "not-json");
		const { result } = renderHook(() => useToolRatings());
		expect(result.current.getRating("any-tool")).toBeNull();
	});

	it("tracks multiple tools independently", () => {
		const { result } = renderHook(() => useToolRatings());
		act(() => {
			result.current.rateTool("tool-a", 5);
			result.current.rateTool("tool-b", 1);
		});
		expect(result.current.getRating("tool-a")).toBe(5);
		expect(result.current.getRating("tool-b")).toBe(1);
	});
});
