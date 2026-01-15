import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the oRPC query utils before importing the hook
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			history: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "history"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
	},
}));

// Import hook after mocking
import { useCreditsHistory } from "./use-credits-history";

describe("useCreditsHistory", () => {
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
			queryClient.setQueryData(["credits", "history"], initialData);
		}

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("returns loading state initially", () => {
		const { result } = renderHook(() => useCreditsHistory(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.transactions).toEqual([]);
	});

	it("returns transactions from response", async () => {
		const mockData = {
			transactions: [
				{
					id: "tx-1",
					amount: -5,
					type: "USAGE",
					toolSlug: "bg-remover",
					jobId: "job-1",
					description: null,
					createdAt: "2025-01-15T10:00:00.000Z",
				},
				{
					id: "tx-2",
					amount: 100,
					type: "GRANT",
					toolSlug: null,
					jobId: null,
					description: "Monthly credit grant",
					createdAt: "2025-01-01T00:00:00.000Z",
				},
			],
			pagination: {
				total: 2,
				limit: 50,
				offset: 0,
				hasMore: false,
			},
		};

		const { result } = renderHook(() => useCreditsHistory(), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.transactions).toHaveLength(2);
		expect(result.current.transactions[0].id).toBe("tx-1");
		expect(result.current.pagination?.total).toBe(2);
	});

	it("returns empty transactions when no data", async () => {
		const { result } = renderHook(() => useCreditsHistory(), {
			wrapper: createWrapper(undefined),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.transactions).toEqual([]);
		expect(result.current.pagination).toBeUndefined();
	});

	it("provides pagination info correctly", async () => {
		const mockData = {
			transactions: Array.from({ length: 20 }, (_, i) => ({
				id: `tx-${i}`,
				amount: -1,
				type: "USAGE",
				toolSlug: "bg-remover",
				jobId: `job-${i}`,
				description: null,
				createdAt: "2025-01-15T10:00:00.000Z",
			})),
			pagination: {
				total: 50,
				limit: 20,
				offset: 0,
				hasMore: true,
			},
		};

		const { result } = renderHook(() => useCreditsHistory({ limit: 20 }), {
			wrapper: createWrapper(mockData),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.pagination?.hasMore).toBe(true);
		expect(result.current.pagination?.total).toBe(50);
	});
});
