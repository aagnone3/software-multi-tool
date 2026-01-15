import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

// Mock window.location
Object.defineProperty(window, "location", {
	value: {
		href: "http://localhost:3000/billing",
	},
	writable: true,
});

// Store the mock mutation function for control in tests
let mockMutateAsync: Mock;

// Mock the oRPC query utils before importing the hook
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			purchase: {
				mutationOptions: () => ({
					mutationKey: ["credits", "purchase"],
					mutationFn: async (input: {
						packId: string;
						redirectUrl?: string;
					}) => {
						return mockMutateAsync(input);
					},
				}),
			},
		},
	},
}));

// Import hook after mocking
import { useCreditPackPurchase } from "./use-credit-pack-purchase";

describe("useCreditPackPurchase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMutateAsync = vi.fn();
		// Reset window.location.href
		Object.defineProperty(window, "location", {
			value: {
				href: "http://localhost:3000/billing",
			},
			writable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const createWrapper = () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	it("returns initial state with no purchasing", () => {
		const { result } = renderHook(() => useCreditPackPurchase(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isPurchasing).toBe(false);
		expect(result.current.purchasingPackId).toBe(null);
		expect(result.current.error).toBe(null);
		expect(typeof result.current.purchasePack).toBe("function");
	});

	it("sets purchasingPackId when purchasePack is called", async () => {
		mockMutateAsync.mockImplementation(
			() => new Promise(() => {}), // Never resolves to keep isPurchasing true
		);

		const { result } = renderHook(() => useCreditPackPurchase(), {
			wrapper: createWrapper(),
		});

		// Start purchase
		act(() => {
			result.current.purchasePack("bundle");
		});

		await waitFor(() => {
			expect(result.current.purchasingPackId).toBe("bundle");
		});
	});

	it("redirects to checkout URL on success", async () => {
		const checkoutUrl = "https://checkout.stripe.com/test";
		mockMutateAsync.mockResolvedValue({
			checkoutUrl,
			pack: {
				id: "bundle",
				name: "Bundle",
				credits: 200,
				amount: 14.99,
				currency: "USD",
			},
		});

		const { result } = renderHook(() => useCreditPackPurchase(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.purchasePack("bundle");
		});

		expect(window.location.href).toBe(checkoutUrl);
	});

	it("calls onSuccess callback when provided", async () => {
		const checkoutUrl = "https://checkout.stripe.com/test";
		const onSuccess = vi.fn();
		mockMutateAsync.mockResolvedValue({
			checkoutUrl,
			pack: {
				id: "bundle",
				name: "Bundle",
				credits: 200,
				amount: 14.99,
				currency: "USD",
			},
		});

		const { result } = renderHook(
			() => useCreditPackPurchase({ onSuccess }),
			{
				wrapper: createWrapper(),
			},
		);

		await act(async () => {
			await result.current.purchasePack("bundle");
		});

		expect(onSuccess).toHaveBeenCalledWith(checkoutUrl);
	});

	it("calls onError callback when mutation fails", async () => {
		const error = new Error("Checkout failed");
		const onError = vi.fn();
		mockMutateAsync.mockRejectedValue(error);

		const { result } = renderHook(
			() => useCreditPackPurchase({ onError }),
			{
				wrapper: createWrapper(),
			},
		);

		await act(async () => {
			await result.current.purchasePack("bundle");
		});

		expect(onError).toHaveBeenCalledWith(error);
	});

	it("resets purchasingPackId after purchase completes", async () => {
		const checkoutUrl = "https://checkout.stripe.com/test";
		mockMutateAsync.mockResolvedValue({
			checkoutUrl,
			pack: {
				id: "bundle",
				name: "Bundle",
				credits: 200,
				amount: 14.99,
				currency: "USD",
			},
		});

		const { result } = renderHook(() => useCreditPackPurchase(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.purchasePack("bundle");
		});

		expect(result.current.purchasingPackId).toBe(null);
	});

	it("passes current URL as redirectUrl", async () => {
		mockMutateAsync.mockResolvedValue({
			checkoutUrl: "https://checkout.stripe.com/test",
			pack: {
				id: "boost",
				name: "Boost",
				credits: 50,
				amount: 4.99,
				currency: "USD",
			},
		});

		const { result } = renderHook(() => useCreditPackPurchase(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.purchasePack("boost");
		});

		expect(mockMutateAsync).toHaveBeenCalledWith({
			packId: "boost",
			redirectUrl: "http://localhost:3000/billing",
		});
	});
});
