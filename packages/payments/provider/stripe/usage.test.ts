import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Stripe client getter before importing the module
vi.mock("./index", () => ({
	getStripeClient: vi.fn(),
}));

// Mock the logger
vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { getStripeClient } from "./index";
import { findOverageSubscriptionItem, reportOverageToStripe } from "./usage";

const mockGetStripeClient = getStripeClient as unknown as ReturnType<
	typeof vi.fn
>;

describe("Stripe Usage Reporting", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("findOverageSubscriptionItem", () => {
		it("should find overage subscription item by price ID", () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockSubscription = {
				items: {
					data: [
						{ id: "si_base", price: { id: "price_base_456" } },
						{
							id: "si_overage",
							price: { id: "price_overage_123" },
						},
					],
				},
			} as any;

			const result = findOverageSubscriptionItem(mockSubscription);

			expect(result).toEqual({
				id: "si_overage",
				price: { id: "price_overage_123" },
			});
		});

		it("should return undefined when overage price ID is not configured", () => {
			delete process.env.STRIPE_OVERAGE_PRICE_ID;

			const mockSubscription = {
				items: {
					data: [{ id: "si_base", price: { id: "price_base_456" } }],
				},
			} as any;

			const result = findOverageSubscriptionItem(mockSubscription);

			expect(result).toBeUndefined();
		});

		it("should return undefined when subscription has no matching overage item", () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockSubscription = {
				items: {
					data: [
						{ id: "si_base", price: { id: "price_base_456" } },
						{ id: "si_addon", price: { id: "price_addon_789" } },
					],
				},
			} as any;

			const result = findOverageSubscriptionItem(mockSubscription);

			expect(result).toBeUndefined();
		});
	});

	describe("reportOverageToStripe", () => {
		it("should skip when STRIPE_OVERAGE_PRICE_ID is not configured", async () => {
			delete process.env.STRIPE_OVERAGE_PRICE_ID;

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 50,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.error).toContain(
				"STRIPE_OVERAGE_PRICE_ID not configured",
			);
		});

		it("should skip when overage credits is zero", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 0,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(true);
			expect(result.skipped).toBe(true);
		});

		it("should skip when overage credits is negative", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: -10,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(true);
			expect(result.skipped).toBe(true);
		});

		it("should successfully report overage to Stripe", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockUsageRecord = {
				id: "mbur_123",
				object: "usage_record",
				quantity: 50,
				subscription_item: "si_overage",
				livemode: false,
				timestamp: 1706745600,
			};

			const mockStripe = {
				subscriptions: {
					retrieve: vi.fn().mockResolvedValue({
						id: "sub_123",
						items: {
							data: [
								{
									id: "si_base",
									price: { id: "price_base_456" },
								},
								{
									id: "si_overage",
									price: { id: "price_overage_123" },
								},
							],
						},
					}),
				},
				rawRequest: vi.fn().mockResolvedValue(mockUsageRecord),
			};

			mockGetStripeClient.mockReturnValue(mockStripe);

			const periodEnd = new Date("2024-02-01T00:00:00Z");
			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 50,
				periodEnd,
			});

			expect(result.success).toBe(true);
			expect(result.usageRecord).toEqual(mockUsageRecord);
			expect(result.skipped).toBeUndefined();

			expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(
				"sub_123",
			);
			expect(mockStripe.rawRequest).toHaveBeenCalledWith(
				"POST",
				"/v1/subscription_items/si_overage/usage_records",
				{
					quantity: 50,
					timestamp: Math.floor(periodEnd.getTime() / 1000),
					action: "set",
				},
			);
		});

		it("should handle subscription without overage item gracefully", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockStripe = {
				subscriptions: {
					retrieve: vi.fn().mockResolvedValue({
						id: "sub_123",
						items: {
							data: [
								{
									id: "si_base",
									price: { id: "price_base_456" },
								},
							],
						},
					}),
				},
			};

			mockGetStripeClient.mockReturnValue(mockStripe);

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 50,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(false);
			expect(result.skipped).toBe(true);
			expect(result.error).toContain(
				"does not have an overage subscription item",
			);
		});

		it("should handle Stripe API errors", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockStripe = {
				subscriptions: {
					retrieve: vi
						.fn()
						.mockRejectedValue(new Error("Stripe API error")),
				},
			};

			mockGetStripeClient.mockReturnValue(mockStripe);

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 50,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(false);
			expect(result.skipped).toBeUndefined();
			expect(result.error).toBe("Stripe API error");
		});

		it("should handle usage record creation errors", async () => {
			process.env.STRIPE_OVERAGE_PRICE_ID = "price_overage_123";

			const mockStripe = {
				subscriptions: {
					retrieve: vi.fn().mockResolvedValue({
						id: "sub_123",
						items: {
							data: [
								{
									id: "si_overage",
									price: { id: "price_overage_123" },
								},
							],
						},
					}),
				},
				rawRequest: vi
					.fn()
					.mockRejectedValue(
						new Error("Usage record creation failed"),
					),
			};

			mockGetStripeClient.mockReturnValue(mockStripe);

			const result = await reportOverageToStripe({
				subscriptionId: "sub_123",
				overageCredits: 50,
				periodEnd: new Date("2024-02-01"),
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Usage record creation failed");
		});
	});
});
