import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the oRPC query utils before importing the hook
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			balance: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "balance"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
	},
}));

// Import hook after mocking
import { useCreditsBalance } from "./use-credits-balance";

describe("useCreditsBalance", () => {
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
			queryClient.setQueryData(["credits", "balance"], initialData);
		}

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("returns loading state initially", () => {
		const { result } = renderHook(() => useCreditsBalance(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.balance).toBeUndefined();
	});

	it("calculates percentageUsed correctly", async () => {
		const mockBalance = {
			included: 100,
			used: 25,
			remaining: 75,
			overage: 0,
			purchasedCredits: 0,
			totalAvailable: 75,
			periodStart: "2025-01-01T00:00:00.000Z",
			periodEnd: "2025-02-01T00:00:00.000Z",
			plan: { id: "pro", name: "Pro" },
		};

		const { result } = renderHook(() => useCreditsBalance(), {
			wrapper: createWrapper(mockBalance),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.percentageUsed).toBe(25);
	});

	it("detects low credits when remaining is below 20%", async () => {
		const mockBalance = {
			included: 100,
			used: 85,
			remaining: 15,
			overage: 0,
			purchasedCredits: 0,
			totalAvailable: 15,
			periodStart: "2025-01-01T00:00:00.000Z",
			periodEnd: "2025-02-01T00:00:00.000Z",
			plan: { id: "pro", name: "Pro" },
		};

		const { result } = renderHook(() => useCreditsBalance(), {
			wrapper: createWrapper(mockBalance),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.isLowCredits).toBe(true);
	});

	it("does not flag low credits when remaining is above 20%", async () => {
		const mockBalance = {
			included: 100,
			used: 50,
			remaining: 50,
			overage: 0,
			purchasedCredits: 0,
			totalAvailable: 50,
			periodStart: "2025-01-01T00:00:00.000Z",
			periodEnd: "2025-02-01T00:00:00.000Z",
			plan: { id: "pro", name: "Pro" },
		};

		const { result } = renderHook(() => useCreditsBalance(), {
			wrapper: createWrapper(mockBalance),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.isLowCredits).toBe(false);
	});

	it("caps percentageUsed at 100", async () => {
		const mockBalance = {
			included: 100,
			used: 150,
			remaining: 0,
			overage: 50,
			purchasedCredits: 0,
			totalAvailable: 0,
			periodStart: "2025-01-01T00:00:00.000Z",
			periodEnd: "2025-02-01T00:00:00.000Z",
			plan: { id: "pro", name: "Pro" },
		};

		const { result } = renderHook(() => useCreditsBalance(), {
			wrapper: createWrapper(mockBalance),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.percentageUsed).toBe(100);
	});
});
