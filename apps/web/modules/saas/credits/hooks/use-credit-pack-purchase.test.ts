import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreditPackPurchase } from "./use-credit-pack-purchase";

// Mock @repo/config getCreditPacks
vi.mock("@repo/config", () => ({
	getCreditPacks: () => [
		{
			id: "boost",
			name: "Boost",
			credits: 50,
			amount: 4.99,
			currency: "USD",
		},
		{
			id: "bundle",
			name: "Bundle",
			credits: 200,
			amount: 14.99,
			currency: "USD",
		},
		{
			id: "vault",
			name: "Vault",
			credits: 500,
			amount: 29.99,
			currency: "USD",
		},
	],
}));

// Mock useProductAnalytics
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));

// Mock useCreditsBalance to avoid react-query/orpc dependency chain
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => ({
		isFreePlan: false,
		isStarterPlan: false,
		isProPlan: true,
		creditBalance: 100,
		totalCreditsUsed: 0,
		creditUsagePercentage: 0,
		isLoading: false,
	}),
}));

// Mock orpc
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			purchase: {
				mutationOptions: vi.fn(() => ({
					mutationFn: vi.fn(),
				})),
			},
		},
	},
}));

const mockMutateAsync = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => mockUseMutation(),
}));

describe("useCreditPackPurchase", () => {
	it("returns initial state", () => {
		mockUseMutation.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
			error: null,
		});

		const { result } = renderHook(() => useCreditPackPurchase());

		expect(result.current.isPurchasing).toBe(false);
		expect(result.current.purchasingPackId).toBeNull();
		expect(result.current.error).toBeNull();
		expect(typeof result.current.purchasePack).toBe("function");
	});

	it("calls mutateAsync with packId and redirectUrl on purchasePack", async () => {
		const onSuccess = vi.fn();
		mockMutateAsync.mockResolvedValue({
			checkoutUrl: "https://checkout.stripe.com/123",
		});
		mockUseMutation.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
			error: null,
		});

		// Mock window.location.href
		Object.defineProperty(window, "location", {
			value: { href: "http://localhost/test" },
			writable: true,
		});

		const { result } = renderHook(() =>
			useCreditPackPurchase({ onSuccess }),
		);

		await act(async () => {
			await result.current.purchasePack("boost");
		});

		expect(mockMutateAsync).toHaveBeenCalledWith({
			packId: "boost",
			redirectUrl: "http://localhost/test",
		});
		expect(onSuccess).toHaveBeenCalledWith(
			"https://checkout.stripe.com/123",
		);
	});

	it("calls onError when mutateAsync throws", async () => {
		const onError = vi.fn();
		const error = new Error("Purchase failed");
		mockMutateAsync.mockRejectedValue(error);
		mockUseMutation.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
			error: null,
		});

		const { result } = renderHook(() => useCreditPackPurchase({ onError }));

		await act(async () => {
			await result.current.purchasePack("bundle");
		});

		expect(onError).toHaveBeenCalledWith(error);
	});

	it("resets purchasingPackId after completion", async () => {
		mockMutateAsync.mockResolvedValue({
			checkoutUrl: "https://checkout.stripe.com/abc",
		});
		mockUseMutation.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
			error: null,
		});

		const { result } = renderHook(() => useCreditPackPurchase());

		await act(async () => {
			await result.current.purchasePack("vault");
		});

		expect(result.current.purchasingPackId).toBeNull();
	});
});
