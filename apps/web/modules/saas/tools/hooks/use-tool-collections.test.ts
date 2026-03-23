import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToolCollections } from "./use-tool-collections";

const localStorageMock = (() => {
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

beforeEach(() => {
	Object.defineProperty(window, "localStorage", {
		value: localStorageMock,
		writable: true,
	});
	localStorageMock.clear();
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useToolCollections", () => {
	it("starts with empty collections", () => {
		const { result } = renderHook(() => useToolCollections());
		expect(result.current.collections).toEqual([]);
	});

	it("creates a new collection", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("My Workflow", "Favorite tools");
		});
		expect(result.current.collections).toHaveLength(1);
		expect(result.current.collections[0].name).toBe("My Workflow");
		expect(result.current.collections[0].description).toBe(
			"Favorite tools",
		);
		expect(result.current.collections[0].toolSlugs).toEqual([]);
	});

	it("creates collection with initial tool slugs", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("Doc Tools", "", [
				"invoice-processor",
				"contract-analyzer",
			]);
		});
		expect(result.current.collections[0].toolSlugs).toEqual([
			"invoice-processor",
			"contract-analyzer",
		]);
	});

	it("deletes a collection", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("To Delete", "");
		});
		const id = result.current.collections[0].id;
		act(() => {
			result.current.deleteCollection(id);
		});
		expect(result.current.collections).toHaveLength(0);
	});

	it("adds a tool to an existing collection", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("My Collection", "");
		});
		const id = result.current.collections[0].id;
		act(() => {
			result.current.addToolToCollection(id, "news-analyzer");
		});
		expect(result.current.collections[0].toolSlugs).toContain(
			"news-analyzer",
		);
	});

	it("does not add duplicate tools to a collection", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("Test", "", ["news-analyzer"]);
		});
		const id = result.current.collections[0].id;
		act(() => {
			result.current.addToolToCollection(id, "news-analyzer");
		});
		expect(
			result.current.collections[0].toolSlugs.filter(
				(s) => s === "news-analyzer",
			),
		).toHaveLength(1);
	});

	it("removes a tool from a collection", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("Test", "", [
				"news-analyzer",
				"contract-analyzer",
			]);
		});
		const id = result.current.collections[0].id;
		act(() => {
			result.current.removeToolFromCollection(id, "news-analyzer");
		});
		expect(result.current.collections[0].toolSlugs).toEqual([
			"contract-analyzer",
		]);
	});

	it("returns collections containing a specific tool", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("A", "", ["news-analyzer"]);
			result.current.createCollection("B", "", ["contract-analyzer"]);
			result.current.createCollection("C", "", [
				"news-analyzer",
				"contract-analyzer",
			]);
		});
		const newsCollections =
			result.current.getCollectionsForTool("news-analyzer");
		expect(newsCollections).toHaveLength(2);
		expect(newsCollections.map((c) => c.name)).toContain("A");
		expect(newsCollections.map((c) => c.name)).toContain("C");
	});

	it("persists collections to localStorage", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("Persisted", "");
		});
		expect(localStorageMock.setItem).toHaveBeenCalled();
	});

	it("updates a collection name and description", () => {
		const { result } = renderHook(() => useToolCollections());
		act(() => {
			result.current.createCollection("Old Name", "Old Desc");
		});
		const id = result.current.collections[0].id;
		act(() => {
			result.current.updateCollection(id, {
				name: "New Name",
				description: "New Desc",
			});
		});
		expect(result.current.collections[0].name).toBe("New Name");
		expect(result.current.collections[0].description).toBe("New Desc");
	});
});
