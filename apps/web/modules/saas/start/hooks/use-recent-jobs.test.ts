import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the oRPC query utils before importing the hook
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			list: {
				queryOptions: vi.fn(() => ({
					queryKey: ["jobs", "list"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
	},
}));

// Import hook after mocking
import { useRecentJobs } from "./use-recent-jobs";

describe("useRecentJobs", () => {
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
			queryClient.setQueryData(["jobs", "list"], initialData);
		}

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("returns loading state initially", () => {
		const { result } = renderHook(() => useRecentJobs(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.jobs).toEqual([]);
	});

	it("returns empty arrays when no jobs", async () => {
		const mockData = { jobs: [] };

		const { result } = renderHook(() => useRecentJobs(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.jobs).toEqual([]);
		expect(result.current.recentToolSlugs).toEqual([]);
		expect(result.current.recentToolsMap.size).toBe(0);
	});

	it("extracts unique tool slugs from jobs", async () => {
		const mockData = {
			jobs: [
				{
					id: "1",
					toolSlug: "bg-remover",
					status: "COMPLETED",
					createdAt: "2025-01-15T12:00:00.000Z",
					completedAt: "2025-01-15T12:01:00.000Z",
				},
				{
					id: "2",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: "2025-01-15T11:00:00.000Z",
					completedAt: "2025-01-15T11:01:00.000Z",
				},
				{
					id: "3",
					toolSlug: "bg-remover",
					status: "COMPLETED",
					createdAt: "2025-01-15T10:00:00.000Z",
					completedAt: "2025-01-15T10:01:00.000Z",
				},
			],
		};

		const { result } = renderHook(() => useRecentJobs(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.recentToolSlugs).toEqual([
			"bg-remover",
			"news-analyzer",
		]);
	});

	it("maps tools to their most recent job", async () => {
		const mockData = {
			jobs: [
				{
					id: "1",
					toolSlug: "bg-remover",
					status: "COMPLETED",
					createdAt: "2025-01-15T12:00:00.000Z",
					completedAt: "2025-01-15T12:01:00.000Z",
				},
				{
					id: "2",
					toolSlug: "bg-remover",
					status: "COMPLETED",
					createdAt: "2025-01-15T10:00:00.000Z",
					completedAt: "2025-01-15T10:01:00.000Z",
				},
			],
		};

		const { result } = renderHook(() => useRecentJobs(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		const bgRemoverJob = result.current.recentToolsMap.get("bg-remover");
		expect(bgRemoverJob?.id).toBe("1"); // Most recent job
	});

	it("respects the limit parameter", async () => {
		const mockData = {
			jobs: [
				{
					id: "1",
					toolSlug: "bg-remover",
					status: "COMPLETED",
					createdAt: "2025-01-15T12:00:00.000Z",
					completedAt: null,
				},
			],
		};

		const { result } = renderHook(() => useRecentJobs(10), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.jobs.length).toBe(1);
	});
});
