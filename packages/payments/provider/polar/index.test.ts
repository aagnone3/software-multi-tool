import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	createPurchase: vi.fn(),
	deletePurchaseBySubscriptionId: vi.fn(),
	getPurchaseBySubscriptionId: vi.fn(),
	updatePurchase: vi.fn(),
}));

vi.mock("../../src/lib/customer", () => ({
	setCustomerIdToEntity: vi.fn(),
}));

// Shared mock instances hoisted so they're available before any imports
const {
	mockCheckoutsCreate,
	mockCustomerSessionsCreate,
	mockSubscriptionsRevoke,
	mockValidateEvent,
} = vi.hoisted(() => ({
	mockCheckoutsCreate: vi.fn(),
	mockCustomerSessionsCreate: vi.fn(),
	mockSubscriptionsRevoke: vi.fn(),
	mockValidateEvent: vi.fn(),
}));

vi.mock("@polar-sh/sdk", () => {
	// Use a regular function so `new Polar()` works
	function Polar() {
		this.checkouts = { create: mockCheckoutsCreate };
		this.customerSessions = { create: mockCustomerSessionsCreate };
		this.subscriptions = { revoke: mockSubscriptionsRevoke };
	}
	return { Polar };
});

vi.mock("@polar-sh/sdk/webhooks.js", () => ({
	validateEvent: mockValidateEvent,
	WebhookVerificationError: class WebhookVerificationError extends Error {},
}));

// Stub env before module is imported to allow singleton initialization
vi.stubEnv("POLAR_ACCESS_TOKEN", "tok_test");
vi.stubEnv("POLAR_WEBHOOK_SECRET", "whsec_polar");

import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@repo/database";
import {
	cancelSubscription,
	createCheckoutLink,
	createCustomerPortalLink,
	setSubscriptionSeats,
	webhookHandler,
} from "./index";

describe("createCheckoutLink", () => {
	it("returns checkout URL", async () => {
		mockCheckoutsCreate.mockResolvedValueOnce({
			url: "https://polar.sh/chk/1",
		});
		const result = await createCheckoutLink({
			productId: "prod_1",
			redirectUrl: "https://example.com/success",
			userId: "u1",
			organizationId: "org_1",
			customerId: null,
			seats: 1,
			email: "a@b.com",
		});
		expect(result).toBe("https://polar.sh/chk/1");
		expect(mockCheckoutsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				products: ["prod_1"],
				successUrl: "https://example.com/success",
			}),
		);
	});
});

describe("createCustomerPortalLink", () => {
	it("returns customerPortalUrl", async () => {
		mockCustomerSessionsCreate.mockResolvedValueOnce({
			customerPortalUrl: "https://portal.polar.sh/x",
		});
		const result = await createCustomerPortalLink({ customerId: "cust_1" });
		expect(result).toBe("https://portal.polar.sh/x");
	});
});

describe("setSubscriptionSeats", () => {
	it("throws not implemented", async () => {
		await expect(
			setSubscriptionSeats({
				id: "sub_1",
				seats: 5,
				organizationId: "org_1",
			}),
		).rejects.toThrow("Not implemented");
	});
});

describe("cancelSubscription", () => {
	it("calls revoke on polar client", async () => {
		mockSubscriptionsRevoke.mockResolvedValueOnce({});
		await cancelSubscription("sub_123");
		expect(mockSubscriptionsRevoke).toHaveBeenCalledWith({ id: "sub_123" });
	});
});

describe("webhookHandler", () => {
	beforeEach(() => {
		vi.mocked(createPurchase).mockResolvedValue(undefined as never);
		vi.mocked(updatePurchase).mockResolvedValue(undefined as never);
		vi.mocked(deletePurchaseBySubscriptionId).mockResolvedValue(
			undefined as never,
		);
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValue(null as never);
		vi.clearAllMocks();
	});

	it("handles order.created (one-time purchase)", async () => {
		mockValidateEvent.mockReturnValueOnce({
			type: "order.created",
			data: {
				customerId: "cust_1",
				productId: "prod_1",
				subscription: null,
				metadata: { user_id: "u1", organization_id: "org_1" },
			},
		});
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(202);
		expect(createPurchase).toHaveBeenCalled();
	});

	it("handles subscription.created", async () => {
		mockValidateEvent.mockReturnValueOnce({
			type: "subscription.created",
			data: {
				id: "sub_1",
				customerId: "cust_1",
				productId: "prod_1",
				status: "active",
				metadata: { user_id: "u1", organization_id: "org_1" },
			},
		});
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(202);
		expect(createPurchase).toHaveBeenCalled();
	});

	it("handles subscription.updated (existing)", async () => {
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValueOnce({
			id: "pur_1",
		} as never);
		mockValidateEvent.mockReturnValueOnce({
			type: "subscription.updated",
			data: { id: "sub_1", status: "active", productId: "prod_1" },
		});
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(202);
		expect(updatePurchase).toHaveBeenCalled();
	});

	it("handles subscription.canceled", async () => {
		mockValidateEvent.mockReturnValueOnce({
			type: "subscription.canceled",
			data: { id: "sub_1" },
		});
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(202);
		expect(deletePurchaseBySubscriptionId).toHaveBeenCalledWith("sub_1");
	});

	it("returns 200 for unhandled event type", async () => {
		mockValidateEvent.mockReturnValueOnce({ type: "unknown", data: {} });
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(200);
	});

	it("returns 403 for WebhookVerificationError", async () => {
		const { WebhookVerificationError } = await import(
			"@polar-sh/sdk/webhooks.js"
		);
		mockValidateEvent.mockImplementationOnce(() => {
			throw new WebhookVerificationError("bad sig");
		});
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(403);
	});
});
