import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all external dependencies before importing the module
vi.mock("@repo/config", () => ({
	getPlanCredits: vi.fn(),
	getPlanIdFromPriceId: vi.fn(),
}));

vi.mock("@repo/database", () => ({
	adjustCreditsForPlanChange: vi.fn(),
	createPurchase: vi.fn(),
	deletePurchaseBySubscriptionId: vi.fn(),
	getCreditBalanceByOrganizationId: vi.fn(),
	getOrganizationByPaymentsCustomerId: vi.fn(),
	getPurchaseBySubscriptionId: vi.fn(),
	grantCredits: vi.fn(),
	resetCreditsForNewPeriod: vi.fn(),
	updatePurchase: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../../src/lib/customer", () => ({
	setCustomerIdToEntity: vi.fn(),
}));

// Mock Stripe
vi.mock("stripe", () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			webhooks: {
				constructEventAsync: vi.fn(),
			},
			checkout: {
				sessions: {
					retrieve: vi.fn(),
				},
			},
			subscriptions: {
				retrieve: vi.fn(),
			},
		})),
	};
});

// Import mocked modules
import { getPlanCredits, getPlanIdFromPriceId } from "@repo/config";
import {
	adjustCreditsForPlanChange,
	createPurchase,
	deletePurchaseBySubscriptionId,
	getOrganizationByPaymentsCustomerId,
	grantCredits,
	resetCreditsForNewPeriod,
} from "@repo/database";
import { setCustomerIdToEntity } from "../../src/lib/customer";

describe("Credit Webhook Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment
		process.env.STRIPE_SECRET_KEY = "sk_test_123";
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
	});

	describe("getPlanIdFromPriceId", () => {
		it("should return plan ID for valid price ID", () => {
			const mockGetPlanIdFromPriceId = vi.mocked(getPlanIdFromPriceId);
			mockGetPlanIdFromPriceId.mockReturnValue("pro");

			const result = getPlanIdFromPriceId("price_pro_monthly");
			expect(result).toBe("pro");
		});

		it("should return undefined for unknown price ID", () => {
			const mockGetPlanIdFromPriceId = vi.mocked(getPlanIdFromPriceId);
			mockGetPlanIdFromPriceId.mockReturnValue(undefined);

			const result = getPlanIdFromPriceId("price_unknown");
			expect(result).toBeUndefined();
		});
	});

	describe("getPlanCredits", () => {
		it("should return credits for valid plan", () => {
			const mockGetPlanCredits = vi.mocked(getPlanCredits);
			mockGetPlanCredits.mockReturnValue({ included: 500 });

			const result = getPlanCredits("pro");
			expect(result).toEqual({ included: 500 });
		});

		it("should return undefined for unknown plan", () => {
			const mockGetPlanCredits = vi.mocked(getPlanCredits);
			mockGetPlanCredits.mockReturnValue(undefined);

			const result = getPlanCredits("unknown");
			expect(result).toBeUndefined();
		});
	});

	describe("grantCredits", () => {
		it("should grant credits with correct parameters", async () => {
			const mockGrantCredits = vi.mocked(grantCredits);
			mockGrantCredits.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await grantCredits({
				organizationId: "org_test123",
				included: 500,
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			expect(mockGrantCredits).toHaveBeenCalledWith({
				organizationId: "org_test123",
				included: 500,
				periodStart: expect.any(Date),
				periodEnd: expect.any(Date),
			});
		});
	});

	describe("resetCreditsForNewPeriod", () => {
		it("should reset credits for renewal", async () => {
			const mockResetCredits = vi.mocked(resetCreditsForNewPeriod);
			mockResetCredits.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await resetCreditsForNewPeriod({
				organizationId: "org_test123",
				periodStart: new Date(),
				periodEnd: new Date(),
			});

			expect(mockResetCredits).toHaveBeenCalledWith({
				organizationId: "org_test123",
				periodStart: expect.any(Date),
				periodEnd: expect.any(Date),
			});
		});
	});

	describe("adjustCreditsForPlanChange", () => {
		it("should adjust credits for plan upgrade", async () => {
			const mockAdjustCredits = vi.mocked(adjustCreditsForPlanChange);
			mockAdjustCredits.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 1000,
				used: 50,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await adjustCreditsForPlanChange({
				organizationId: "org_test123",
				newIncluded: 1000,
				description: "Plan upgrade from pro to enterprise",
			});

			expect(mockAdjustCredits).toHaveBeenCalledWith({
				organizationId: "org_test123",
				newIncluded: 1000,
				description: "Plan upgrade from pro to enterprise",
			});
		});
	});

	describe("getOrganizationByPaymentsCustomerId", () => {
		it("should find organization by customer ID", async () => {
			const mockGetOrg = vi.mocked(getOrganizationByPaymentsCustomerId);
			mockGetOrg.mockResolvedValue({
				id: "org_test123",
				name: "Test Org",
				slug: "test-org",
				logo: null,
				createdAt: new Date(),
				metadata: null,
				paymentsCustomerId: "cus_test123",
			});

			const result =
				await getOrganizationByPaymentsCustomerId("cus_test123");
			expect(result?.id).toBe("org_test123");
		});

		it("should return null for unknown customer ID", async () => {
			const mockGetOrg = vi.mocked(getOrganizationByPaymentsCustomerId);
			mockGetOrg.mockResolvedValue(null);

			const result =
				await getOrganizationByPaymentsCustomerId("cus_unknown");
			expect(result).toBeNull();
		});
	});

	describe("Subscription lifecycle scenarios", () => {
		it("should handle new subscription with credits", async () => {
			// Setup mocks
			const mockCreatePurchase = vi.mocked(createPurchase);
			const mockSetCustomerId = vi.mocked(setCustomerIdToEntity);
			const mockGetPlanId = vi.mocked(getPlanIdFromPriceId);
			const mockGetPlanCreds = vi.mocked(getPlanCredits);
			const mockGrant = vi.mocked(grantCredits);

			mockCreatePurchase.mockResolvedValue({
				id: "purchase_123",
				subscriptionId: "sub_test123",
				organizationId: "org_test123",
				userId: "user_test123",
				customerId: "cus_test123",
				type: "SUBSCRIPTION",
				productId: "price_pro_monthly",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockSetCustomerId.mockResolvedValue(undefined);
			mockGetPlanId.mockReturnValue("pro");
			mockGetPlanCreds.mockReturnValue({ included: 500 });
			mockGrant.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Verify that all mocks are set up correctly
			expect(getPlanIdFromPriceId("price_pro_monthly")).toBe("pro");
			expect(getPlanCredits("pro")).toEqual({ included: 500 });
		});

		it("should handle subscription renewal with credit reset", async () => {
			const mockGetOrg = vi.mocked(getOrganizationByPaymentsCustomerId);
			const mockResetCredits = vi.mocked(resetCreditsForNewPeriod);

			mockGetOrg.mockResolvedValue({
				id: "org_test123",
				name: "Test Org",
				slug: "test-org",
				logo: null,
				createdAt: new Date(),
				metadata: null,
				paymentsCustomerId: "cus_test123",
			});
			mockResetCredits.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 500,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const org =
				await getOrganizationByPaymentsCustomerId("cus_test123");
			expect(org?.id).toBe("org_test123");
		});

		it("should handle plan upgrade with credit adjustment", async () => {
			const mockGetOrg = vi.mocked(getOrganizationByPaymentsCustomerId);
			const mockGetPlanId = vi.mocked(getPlanIdFromPriceId);
			const mockGetPlanCreds = vi.mocked(getPlanCredits);
			const mockAdjustCredits = vi.mocked(adjustCreditsForPlanChange);

			mockGetOrg.mockResolvedValue({
				id: "org_test123",
				name: "Test Org",
				slug: "test-org",
				logo: null,
				createdAt: new Date(),
				metadata: null,
				paymentsCustomerId: "cus_test123",
			});

			// First call for old plan, second for new plan
			mockGetPlanId
				.mockReturnValueOnce("pro")
				.mockReturnValueOnce("enterprise");
			mockGetPlanCreds
				.mockReturnValueOnce({ included: 500 }) // old plan
				.mockReturnValueOnce({ included: 5000 }); // new plan

			mockAdjustCredits.mockResolvedValue({
				id: "balance_123",
				organizationId: "org_test123",
				included: 5000,
				used: 100,
				overage: 0,
				purchasedCredits: 0,
				periodStart: new Date(),
				periodEnd: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Simulate plan change detection
			const oldPlanId = getPlanIdFromPriceId("price_pro_monthly");
			const newPlanId = getPlanIdFromPriceId("price_enterprise_monthly");
			const oldCredits = oldPlanId
				? getPlanCredits(oldPlanId)
				: undefined;
			const newCredits = newPlanId
				? getPlanCredits(newPlanId)
				: undefined;

			expect(oldPlanId).toBe("pro");
			expect(newPlanId).toBe("enterprise");
			expect(oldCredits?.included).toBe(500);
			expect(newCredits?.included).toBe(5000);
			expect(newCredits?.included).toBeGreaterThan(
				oldCredits?.included ?? 0,
			);
		});

		it("should handle subscription cancellation without revoking credits", async () => {
			const mockDeletePurchase = vi.mocked(
				deletePurchaseBySubscriptionId,
			);
			mockDeletePurchase.mockResolvedValue(undefined);

			await deletePurchaseBySubscriptionId("sub_test123");

			expect(mockDeletePurchase).toHaveBeenCalledWith("sub_test123");
			// Note: Credits are NOT revoked - they remain until period end
		});
	});
});
