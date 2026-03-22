import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQueryOptions = vi.fn();

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			listPurchases: {
				queryOptions: (opts: unknown) => mockQueryOptions(opts),
			},
		},
	},
}));

const mockCreatePurchasesHelper = vi.fn();
vi.mock("@repo/payments/lib/helper", () => ({
	createPurchasesHelper: (purchases: unknown) =>
		mockCreatePurchasesHelper(purchases),
}));

import {
	useOrganizationPurchases,
	usePurchases,
	useUserPurchases,
} from "./purchases";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) =>
		React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
}

describe("usePurchases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreatePurchasesHelper.mockReturnValue({
			activePlan: null,
			hasSubscription: false,
			hasPurchase: false,
		});
	});

	it("returns empty purchases by default while loading", () => {
		mockQueryOptions.mockReturnValue({
			queryKey: ["payments", "listPurchases"],
			queryFn: () => new Promise(() => {}), // never resolves (loading)
		});

		const { result } = renderHook(() => usePurchases(), {
			wrapper: createWrapper(),
		});

		expect(result.current.purchases).toEqual([]);
	});

	it("returns purchases and helper values from resolved query", async () => {
		const fakePurchases = [
			{ id: "p1", type: "SUBSCRIPTION", productId: "pro" },
		];
		mockQueryOptions.mockReturnValue({
			queryKey: ["payments", "listPurchases"],
			queryFn: () => Promise.resolve({ purchases: fakePurchases }),
		});
		mockCreatePurchasesHelper.mockReturnValue({
			activePlan: { id: "pro" },
			hasSubscription: true,
			hasPurchase: true,
		});

		const { result } = renderHook(() => usePurchases(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.purchases).toEqual(fakePurchases);
		});
		expect(result.current.activePlan).toEqual({ id: "pro" });
		expect(result.current.hasSubscription).toBe(true);
		expect(result.current.hasPurchase).toBe(true);
	});

	it("passes organizationId to queryOptions", () => {
		mockQueryOptions.mockReturnValue({
			queryKey: ["payments", "listPurchases", "org-1"],
			queryFn: () => Promise.resolve({ purchases: [] }),
		});

		renderHook(() => usePurchases("org-1"), { wrapper: createWrapper() });

		expect(mockQueryOptions).toHaveBeenCalledWith({
			input: { organizationId: "org-1" },
		});
	});
});

describe("useUserPurchases", () => {
	it("calls usePurchases with no organizationId", async () => {
		mockQueryOptions.mockReturnValue({
			queryKey: ["payments", "listPurchases"],
			queryFn: () => Promise.resolve({ purchases: [] }),
		});

		const { result } = renderHook(() => useUserPurchases(), {
			wrapper: createWrapper(),
		});

		expect(result.current.purchases).toEqual([]);
	});
});

describe("useOrganizationPurchases", () => {
	it("passes organizationId to queryOptions", () => {
		mockQueryOptions.mockReturnValue({
			queryKey: ["payments", "listPurchases", "org-2"],
			queryFn: () => Promise.resolve({ purchases: [] }),
		});

		renderHook(() => useOrganizationPurchases("org-2"), {
			wrapper: createWrapper(),
		});

		expect(mockQueryOptions).toHaveBeenCalledWith({
			input: { organizationId: "org-2" },
		});
	});
});
