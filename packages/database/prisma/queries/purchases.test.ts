import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	purchaseFindUnique: vi.fn(),
	purchaseFindMany: vi.fn(),
	purchaseFindFirst: vi.fn(),
	purchaseCreate: vi.fn(),
	purchaseUpdate: vi.fn(),
	purchaseDeleteMany: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		purchase: {
			findUnique: mocks.purchaseFindUnique,
			findMany: mocks.purchaseFindMany,
			findFirst: mocks.purchaseFindFirst,
			create: mocks.purchaseCreate,
			update: mocks.purchaseUpdate,
			deleteMany: mocks.purchaseDeleteMany,
		},
	},
}));

import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseById,
	getPurchaseBySubscriptionId,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
	updatePurchase,
} from "./purchases";

describe("purchases queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("getPurchaseById", () => {
		it("returns purchase for given id", async () => {
			const mockPurchase = { id: "purchase-1", userId: "user-1" };
			mocks.purchaseFindUnique.mockResolvedValue(mockPurchase);

			const result = await getPurchaseById("purchase-1");

			expect(result).toEqual(mockPurchase);
			expect(mocks.purchaseFindUnique).toHaveBeenCalledWith({
				where: { id: "purchase-1" },
			});
		});

		it("returns null when purchase not found", async () => {
			mocks.purchaseFindUnique.mockResolvedValue(null);

			const result = await getPurchaseById("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("getPurchasesByOrganizationId", () => {
		it("returns purchases for given organization", async () => {
			const mockPurchases = [
				{ id: "p1", organizationId: "org-1" },
				{ id: "p2", organizationId: "org-1" },
			];
			mocks.purchaseFindMany.mockResolvedValue(mockPurchases);

			const result = await getPurchasesByOrganizationId("org-1");

			expect(result).toEqual(mockPurchases);
			expect(mocks.purchaseFindMany).toHaveBeenCalledWith({
				where: { organizationId: "org-1" },
			});
		});
	});

	describe("getPurchasesByUserId", () => {
		it("returns purchases for given user", async () => {
			const mockPurchases = [{ id: "p1", userId: "user-1" }];
			mocks.purchaseFindMany.mockResolvedValue(mockPurchases);

			const result = await getPurchasesByUserId("user-1");

			expect(result).toEqual(mockPurchases);
			expect(mocks.purchaseFindMany).toHaveBeenCalledWith({
				where: { userId: "user-1" },
			});
		});
	});

	describe("getPurchaseBySubscriptionId", () => {
		it("returns purchase for given subscription id", async () => {
			const mockPurchase = { id: "p1", subscriptionId: "sub-123" };
			mocks.purchaseFindFirst.mockResolvedValue(mockPurchase);

			const result = await getPurchaseBySubscriptionId("sub-123");

			expect(result).toEqual(mockPurchase);
			expect(mocks.purchaseFindFirst).toHaveBeenCalledWith({
				where: { subscriptionId: "sub-123" },
			});
		});

		it("returns null when no purchase found for subscription", async () => {
			mocks.purchaseFindFirst.mockResolvedValue(null);

			const result = await getPurchaseBySubscriptionId("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("createPurchase", () => {
		it("creates and returns the new purchase", async () => {
			const newPurchase = {
				id: "p-new",
				userId: "user-1",
				productId: "prod-1",
				subscriptionId: "sub-1",
				customerId: "cus-1",
				status: "active",
				organizationId: null,
			};
			mocks.purchaseCreate.mockResolvedValue({ id: "p-new" });
			mocks.purchaseFindUnique.mockResolvedValue(newPurchase);

			const result = await createPurchase({
				userId: "user-1",
				productId: "prod-1",
				subscriptionId: "sub-1",
				customerId: "cus-1",
				status: "active",
				organizationId: null,
			});

			expect(result).toEqual(newPurchase);
			expect(mocks.purchaseCreate).toHaveBeenCalled();
			expect(mocks.purchaseFindUnique).toHaveBeenCalledWith({
				where: { id: "p-new" },
			});
		});
	});

	describe("updatePurchase", () => {
		it("updates and returns the updated purchase", async () => {
			const updatedPurchase = {
				id: "p1",
				status: "cancelled",
				userId: "user-1",
			};
			mocks.purchaseUpdate.mockResolvedValue({ id: "p1" });
			mocks.purchaseFindUnique.mockResolvedValue(updatedPurchase);

			const result = await updatePurchase({
				id: "p1",
				status: "cancelled",
			});

			expect(result).toEqual(updatedPurchase);
			expect(mocks.purchaseUpdate).toHaveBeenCalledWith({
				where: { id: "p1" },
				data: { id: "p1", status: "cancelled" },
			});
		});
	});

	describe("deletePurchaseBySubscriptionId", () => {
		it("deletes purchases by subscription id", async () => {
			mocks.purchaseDeleteMany.mockResolvedValue({ count: 1 });

			await deletePurchaseBySubscriptionId("sub-123");

			expect(mocks.purchaseDeleteMany).toHaveBeenCalledWith({
				where: { subscriptionId: "sub-123" },
			});
		});

		it("handles case where no records exist", async () => {
			mocks.purchaseDeleteMany.mockResolvedValue({ count: 0 });

			await expect(
				deletePurchaseBySubscriptionId("non-existent"),
			).resolves.not.toThrow();
		});
	});
});
