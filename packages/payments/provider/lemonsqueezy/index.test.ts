import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lemonsqueezy/lemonsqueezy.js", () => ({
	lemonSqueezySetup: vi.fn(),
	createCheckout: vi.fn(),
	getCustomer: vi.fn(),
	getSubscription: vi.fn(),
	updateSubscriptionItem: vi.fn(),
	cancelSubscription: vi.fn(),
}));

vi.mock("@repo/database", () => ({
	createPurchase: vi.fn(),
	deletePurchaseBySubscriptionId: vi.fn(),
	getPurchaseBySubscriptionId: vi.fn(),
	updatePurchase: vi.fn(),
}));

vi.mock("../../src/lib/customer", () => ({
	setCustomerIdToEntity: vi.fn(),
}));

import {
	cancelSubscription as cancelSubscriptionResolver,
	createCheckout,
	getCustomer,
	getSubscription,
	updateSubscriptionItem,
} from "@lemonsqueezy/lemonsqueezy.js";
import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@repo/database";
import { setCustomerIdToEntity } from "../../src/lib/customer";
import {
	cancelSubscription,
	createCheckoutLink,
	createCustomerPortalLink,
	setSubscriptionSeats,
	webhookHandler,
} from "./index";

const WEBHOOK_SECRET = "test-webhook-secret";

function makeWebhookRequest(payload: object, secret = WEBHOOK_SECRET): Request {
	const text = JSON.stringify(payload);
	const hmac = createHmac("sha256", secret);
	const signature = hmac.update(text).digest("hex");
	return new Request("http://localhost/webhook", {
		method: "POST",
		body: text,
		headers: {
			"x-signature": signature,
			"Content-Type": "application/json",
		},
	});
}

function makeSubscriptionPayload(
	eventName: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		meta: {
			event_name: eventName,
			custom_data: {
				organization_id: "org-1",
				user_id: "user-1",
			},
		},
		data: {
			id: "sub-123",
			attributes: {
				customer_id: "cust-456",
				product_id: "prod-789",
				variant_id: "var-999",
				status: "active",
				...overrides,
			},
		},
	};
}

describe("LemonSqueezy webhookHandler", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
		process.env.LEMONSQUEEZY_API_KEY = "test-api-key";
		process.env.LEMONSQUEEZY_STORE_ID = "store-1";
	});

	it("returns 400 for invalid signature", async () => {
		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_created"),
			"wrong-secret",
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
		const text = await res.text();
		expect(text).toContain("Invalid signature");
	});

	it("handles subscription_created event", async () => {
		vi.mocked(createPurchase).mockResolvedValue({
			id: "purchase-1",
		} as never);
		vi.mocked(setCustomerIdToEntity).mockResolvedValue(undefined);

		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_created"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({
				subscriptionId: "sub-123",
				customerId: "cust-456",
				productId: "var-999",
				status: "active",
				type: "SUBSCRIPTION",
				organizationId: "org-1",
			}),
		);
	});

	it("handles subscription_updated event", async () => {
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValue({
			id: "purchase-1",
		} as never);
		vi.mocked(updatePurchase).mockResolvedValue({
			id: "purchase-1",
		} as never);

		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_updated"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(updatePurchase).toHaveBeenCalledWith({
			id: "purchase-1",
			status: "active",
		});
	});

	it("handles subscription_cancelled event", async () => {
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValue({
			id: "purchase-2",
		} as never);
		vi.mocked(updatePurchase).mockResolvedValue({
			id: "purchase-2",
		} as never);

		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_cancelled"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
	});

	it("handles subscription_expired event", async () => {
		vi.mocked(deletePurchaseBySubscriptionId).mockResolvedValue(undefined);

		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_expired"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(deletePurchaseBySubscriptionId).toHaveBeenCalledWith("sub-123");
	});

	it("handles order_created event", async () => {
		vi.mocked(createPurchase).mockResolvedValue({
			id: "purchase-3",
		} as never);
		vi.mocked(setCustomerIdToEntity).mockResolvedValue(undefined);

		const req = makeWebhookRequest(
			makeSubscriptionPayload("order_created"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({
				customerId: "cust-456",
				productId: "prod-789",
				type: "ONE_TIME",
			}),
		);
	});

	it("returns 200 for unhandled event type", async () => {
		const req = makeWebhookRequest(
			makeSubscriptionPayload("some_unknown_event"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toContain("Unhandled event type");
	});

	it("returns 400 on error", async () => {
		vi.mocked(createPurchase).mockRejectedValue(new Error("db error"));
		const req = makeWebhookRequest(
			makeSubscriptionPayload("subscription_created"),
		);
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
		const text = await res.text();
		expect(text).toContain("Webhook error");
	});
});

describe("LemonSqueezy createCheckoutLink", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.LEMONSQUEEZY_API_KEY = "test-api-key";
		process.env.LEMONSQUEEZY_STORE_ID = "store-1";
	});

	it("returns checkout URL", async () => {
		vi.mocked(createCheckout).mockResolvedValue({
			data: {
				data: { attributes: { url: "https://checkout.example.com" } },
			},
		} as never);

		const result = await createCheckoutLink({
			productId: "123",
			redirectUrl: "https://app.example.com",
			email: "user@example.com",
			name: "Test User",
			userId: "user-1",
		});

		expect(result).toBe("https://checkout.example.com");
	});

	it("returns null when no URL in response", async () => {
		vi.mocked(createCheckout).mockResolvedValue({ data: null } as never);
		const result = await createCheckoutLink({
			productId: "123",
			redirectUrl: "https://app.example.com",
			email: "user@example.com",
			name: "Test User",
			userId: "user-1",
		});
		expect(result).toBeNull();
	});
});

describe("LemonSqueezy createCustomerPortalLink", () => {
	it("returns customer portal URL", async () => {
		vi.mocked(getCustomer).mockResolvedValue({
			data: {
				data: {
					attributes: {
						urls: { customer_portal: "https://portal.example.com" },
					},
				},
			},
		} as never);

		const result = await createCustomerPortalLink({
			customerId: "cust-1",
			userId: "user-1",
		});
		expect(result).toBe("https://portal.example.com");
	});
});

describe("LemonSqueezy cancelSubscription", () => {
	it("calls cancelSubscriptionResolver with correct id", async () => {
		vi.mocked(cancelSubscriptionResolver).mockResolvedValue({} as never);
		await cancelSubscription("sub-abc");
		expect(cancelSubscriptionResolver).toHaveBeenCalledWith("sub-abc");
	});
});

describe("LemonSqueezy setSubscriptionSeats", () => {
	it("throws when subscription not found", async () => {
		vi.mocked(getSubscription).mockResolvedValue({ data: null } as never);
		await expect(
			setSubscriptionSeats({ id: "sub-1", seats: 5 }),
		).rejects.toThrow("Subscription item not found");
	});

	it("throws when subscription item not found", async () => {
		vi.mocked(getSubscription).mockResolvedValue({
			data: {
				data: {
					relationships: { "subscription-items": { data: [] } },
				},
			},
		} as never);
		await expect(
			setSubscriptionSeats({ id: "sub-1", seats: 5 }),
		).rejects.toThrow("Subscription item not found");
	});

	it("updates subscription item quantity", async () => {
		vi.mocked(getSubscription).mockResolvedValue({
			data: {
				data: {
					relationships: {
						"subscription-items": { data: [{ id: "item-1" }] },
					},
				},
			},
		} as never);
		vi.mocked(updateSubscriptionItem).mockResolvedValue({} as never);

		await setSubscriptionSeats({ id: "sub-1", seats: 5 });
		expect(updateSubscriptionItem).toHaveBeenCalledWith("item-1", {
			quantity: 5,
		});
	});
});
