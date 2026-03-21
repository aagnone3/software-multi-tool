import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUsageStats } from "./use-usage-stats";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			usageStats: {
				queryOptions: vi.fn((opts) => ({
					queryKey: ["credits", "usageStats", opts],
				})),
			},
		},
	},
}));

const mockData = {
	totalUsed: 500,
	totalOverage: 20,
	byTool: [
		{ toolSlug: "tool-a", credits: 300, count: 5 },
		{ toolSlug: "tool-b", credits: 200, count: 3 },
	],
	byPeriod: [
		{ date: "2026-03-20", credits: 250 },
		{ date: "2026-03-21", credits: 250 },
	],
};

describe("useUsageStats", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns loading state", () => {
		useQueryMock.mockReturnValue({
			isLoading: true,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useUsageStats());
		expect(result.current.isLoading).toBe(true);
		expect(result.current.totalUsed).toBe(0);
	});

	it("returns stats data with computed fields", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: mockData,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useUsageStats());
		expect(result.current.totalUsed).toBe(500);
		expect(result.current.totalOverage).toBe(20);
		expect(result.current.byTool).toHaveLength(2);
		// mostUsedTool should be tool-a (300 > 200)
		expect(result.current.mostUsedTool?.toolSlug).toBe("tool-a");
		// totalOperations = 5 + 3 = 8
		expect(result.current.totalOperations).toBe(8);
	});

	it("returns null mostUsedTool when no byTool data", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: { ...mockData, byTool: [] },
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useUsageStats());
		expect(result.current.mostUsedTool).toBeNull();
	});

	it("passes params to query options", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		renderHook(() => useUsageStats({ period: "week" }));
		const callArgs = useQueryMock.mock.calls[0][0];
		expect(callArgs.queryKey).toContainEqual({ input: { period: "week" } });
	});
});
