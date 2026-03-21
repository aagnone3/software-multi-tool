import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	purchaseFindMany: vi.fn(),
	purchaseFindFirst: vi.fn(),
	purchaseInsert: vi.fn(),
	purchaseUpdate: vi.fn(),
	purchaseDelete: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		query: {
			purchase: {
				findMany: mocks.purchaseFindMany,
				findFirst: mocks.purchaseFindFirst,
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: mocks.purchaseInsert,
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				returning: mocks.purchaseUpdate,
			})),
		})),
		delete: vi.fn(() => ({
			where: mocks.purchaseDelete,
		})),
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

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getPurchasesByOrganizationId", () => {
	it("returns purchases for org", async () => {
		mocks.purchaseFindMany.mockResolvedValueOnce([{ id: "p1" }]);
		const result = await getPurchasesByOrganizationId("org1");
		expect(result).toEqual([{ id: "p1" }]);
	});
});

describe("getPurchasesByUserId", () => {
	it("returns purchases for user", async () => {
		mocks.purchaseFindMany.mockResolvedValueOnce([{ id: "p2" }]);
		const result = await getPurchasesByUserId("u1");
		expect(result).toEqual([{ id: "p2" }]);
	});
});

describe("getPurchaseById", () => {
	it("returns purchase by id", async () => {
		mocks.purchaseFindFirst.mockResolvedValueOnce({ id: "p3" });
		const result = await getPurchaseById("p3");
		expect(result).toEqual({ id: "p3" });
	});
});

describe("getPurchaseBySubscriptionId", () => {
	it("returns purchase by subscriptionId", async () => {
		mocks.purchaseFindFirst.mockResolvedValueOnce({ id: "p4" });
		const result = await getPurchaseBySubscriptionId("sub1");
		expect(result).toEqual({ id: "p4" });
	});
});

describe("createPurchase", () => {
	it("inserts and returns the new purchase", async () => {
		mocks.purchaseInsert.mockResolvedValueOnce([{ id: "p5" }]);
		mocks.purchaseFindFirst.mockResolvedValueOnce({
			id: "p5",
			status: "active",
		});
		const result = await createPurchase({
			id: "p5",
			userId: "u1",
			status: "active",
			type: "subscription",
			livemode: false,
		});
		expect(result).toEqual({ id: "p5", status: "active" });
	});
});

describe("updatePurchase", () => {
	it("updates and returns the purchase", async () => {
		mocks.purchaseUpdate.mockResolvedValueOnce([{ id: "p6" }]);
		mocks.purchaseFindFirst.mockResolvedValueOnce({
			id: "p6",
			status: "cancelled",
		});
		const result = await updatePurchase({ id: "p6", status: "cancelled" });
		expect(result).toEqual({ id: "p6", status: "cancelled" });
	});
});

describe("deletePurchaseBySubscriptionId", () => {
	it("deletes by subscriptionId", async () => {
		mocks.purchaseDelete.mockResolvedValueOnce(undefined);
		await deletePurchaseBySubscriptionId("sub2");
		expect(mocks.purchaseDelete).toHaveBeenCalledOnce();
	});
});
