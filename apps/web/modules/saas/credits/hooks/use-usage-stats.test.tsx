import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the oRPC query utils before importing the hook
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			usageStats: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "usageStats"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
	},
}));

// Import hook after mocking
import { useUsageStats } from "./use-usage-stats";

describe("useUsageStats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createWrapper = (initialData?: Record<string, unknown>) => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		if (initialData) {
			queryClient.setQueryData(["credits", "usageStats"], initialData);
		}

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("returns loading state initially", () => {
		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.totalUsed).toBe(0);
	});

	it("returns usage stats from response", async () => {
		const mockData = {
			totalUsed: 150,
			totalOverage: 10,
			byTool: [
				{ toolSlug: "bg-remover", credits: 100, count: 100 },
				{ toolSlug: "diarization", credits: 50, count: 25 },
			],
			byPeriod: [
				{ date: "2025-01-14", credits: 75 },
				{ date: "2025-01-15", credits: 75 },
			],
		};

		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.totalUsed).toBe(150);
		expect(result.current.totalOverage).toBe(10);
		expect(result.current.byTool).toHaveLength(2);
		expect(result.current.byPeriod).toHaveLength(2);
	});

	it("calculates most used tool correctly", async () => {
		const mockData = {
			totalUsed: 150,
			totalOverage: 0,
			byTool: [
				{ toolSlug: "diarization", credits: 50, count: 25 },
				{ toolSlug: "bg-remover", credits: 100, count: 100 },
			],
			byPeriod: [],
		};

		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.mostUsedTool?.toolSlug).toBe("bg-remover");
		expect(result.current.mostUsedTool?.credits).toBe(100);
	});

	it("calculates total operations correctly", async () => {
		const mockData = {
			totalUsed: 150,
			totalOverage: 0,
			byTool: [
				{ toolSlug: "bg-remover", credits: 100, count: 100 },
				{ toolSlug: "diarization", credits: 50, count: 25 },
			],
			byPeriod: [],
		};

		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.totalOperations).toBe(125);
	});

	it("returns null for most used tool when no tools", async () => {
		const mockData = {
			totalUsed: 0,
			totalOverage: 0,
			byTool: [],
			byPeriod: [],
		};

		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.mostUsedTool).toBeNull();
		expect(result.current.totalOperations).toBe(0);
	});

	it("returns defaults when no data", async () => {
		const { result } = renderHook(() => useUsageStats(), {
			wrapper: createWrapper(undefined),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.totalUsed).toBe(0);
		expect(result.current.totalOverage).toBe(0);
		expect(result.current.byTool).toEqual([]);
		expect(result.current.byPeriod).toEqual([]);
	});
});
