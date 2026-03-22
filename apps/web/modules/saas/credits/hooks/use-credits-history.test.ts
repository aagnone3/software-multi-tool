import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreditsHistory } from "./use-credits-history";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			history: {
				queryOptions: vi.fn((opts) => ({
					queryKey: ["credits", "history", opts],
				})),
			},
		},
	},
}));

const mockTransaction = {
	id: "tx-1",
	amount: -50,
	type: "USAGE" as const,
	toolSlug: "tool-a",
	jobId: "job-1",
	description: "Used tool-a",
	createdAt: "2026-03-21T12:00:00Z",
};

const mockData = {
	transactions: [mockTransaction],
	pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
};

describe("useCreditsHistory", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns loading state", () => {
		useQueryMock.mockReturnValue({
			isLoading: true,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsHistory());
		expect(result.current.isLoading).toBe(true);
		expect(result.current.transactions).toEqual([]);
	});

	it("returns transactions and pagination", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: mockData,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsHistory());
		expect(result.current.transactions).toHaveLength(1);
		expect(result.current.transactions[0].id).toBe("tx-1");
		expect(result.current.pagination?.total).toBe(1);
	});

	it("passes params to query", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		renderHook(() => useCreditsHistory({ limit: 5, toolSlug: "tool-a" }));
		const callArgs = useQueryMock.mock.calls[0][0];
		expect(callArgs.queryKey).toContainEqual({
			input: { limit: 5, toolSlug: "tool-a" },
		});
	});

	it("returns undefined pagination when no data", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsHistory());
		expect(result.current.pagination).toBeUndefined();
	});
});
