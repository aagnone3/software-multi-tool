import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJobTags } from "./use-job-tags";

const STORAGE_KEY = "job-tags";

function mockStorage(initial: Record<string, string[]> = {}) {
	const store: Record<string, string> = {
		[STORAGE_KEY]: JSON.stringify(initial),
	};
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(
		(key) => store[key] ?? null,
	);
	vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
		store[key] = value;
	});
}

describe("useJobTags", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns empty tags initially", () => {
		mockStorage({});
		const { result } = renderHook(() => useJobTags("job-1"));
		expect(result.current.tags).toEqual([]);
	});

	it("persists tags to localStorage on add", () => {
		const setItem = vi.spyOn(Storage.prototype, "setItem");
		vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{}");
		const { result } = renderHook(() => useJobTags("job-1"));
		act(() => {
			result.current.addTag("bug");
		});
		expect(setItem).toHaveBeenCalled();
		expect(result.current.tags).toContain("bug");
	});

	it("adds a new tag", () => {
		mockStorage({});
		const { result } = renderHook(() => useJobTags("job-1"));
		act(() => {
			result.current.addTag("important");
		});
		expect(result.current.tags).toContain("important");
	});

	it("does not add duplicate tags", () => {
		mockStorage({});
		const { result } = renderHook(() => useJobTags("job-1"));
		act(() => {
			result.current.addTag("important");
		});
		act(() => {
			result.current.addTag("important");
		});
		expect(
			result.current.tags.filter((t) => t === "important"),
		).toHaveLength(1);
	});

	it("ignores empty/whitespace tags", () => {
		mockStorage({});
		const { result } = renderHook(() => useJobTags("job-1"));
		act(() => {
			result.current.addTag("  ");
		});
		expect(result.current.tags).toHaveLength(0);
	});

	it("removes a tag", () => {
		mockStorage({});
		const { result } = renderHook(() => useJobTags("job-1"));
		act(() => {
			result.current.addTag("bug");
			result.current.addTag("urgent");
		});
		act(() => {
			result.current.removeTag("bug");
		});
		expect(result.current.tags).not.toContain("bug");
		expect(result.current.tags).toContain("urgent");
	});

	it("scopes tags to jobId", () => {
		mockStorage({});
		const { result: r1 } = renderHook(() => useJobTags("job-1"));
		const { result: r2 } = renderHook(() => useJobTags("job-2"));
		act(() => {
			r1.current.addTag("alpha");
		});
		act(() => {
			r2.current.addTag("beta");
		});
		// r1 should only have alpha, r2 only beta
		expect(r1.current.tags).toContain("alpha");
		expect(r2.current.tags).toContain("beta");
		expect(r1.current.tags).not.toContain("beta");
		expect(r2.current.tags).not.toContain("alpha");
	});
});
