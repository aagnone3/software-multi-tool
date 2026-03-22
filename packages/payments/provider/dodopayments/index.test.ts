import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	createPurchase: vi.fn(),
	deletePurchaseBySubscriptionId: vi.fn(),
	getPurchaseBySubscriptionId: vi.fn(),
	updatePurchase: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockCheckoutSessions = {
	create: vi.fn(),
};
const mockCustomers = {
	customerPortal: {
		create: vi.fn(),
	},
};
const mockSubscriptions = {
	retrieve: vi.fn(),
	changePlan: vi.fn(),
	update: vi.fn(),
};

vi.mock("dodopayments", () => {
	return {
		default: class MockDodoPayments {
			checkoutSessions = mockCheckoutSessions;
			customers = mockCustomers;
			subscriptions = mockSubscriptions;
		},
	};
});

vi.mock("../../src/lib/customer", () => ({
	setCustomerIdToEntity: vi.fn(),
}));

import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@repo/database";
import {
	createCheckoutLink,
	createCustomerPortalLink,
	webhookHandler,
} from "./index";

beforeEach(() => {
	vi.stubEnv("DODO_PAYMENTS_API_KEY", "test-dodo-key");
	vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", "test-webhook-secret");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});

describe("createCheckoutLink", () => {
	it("returns checkout_url from dodo payments", async () => {
		mockCheckoutSessions.create.mockResolvedValueOnce({
			checkout_url: "https://checkout.dodo.com/session123",
		});

		const result = await createCheckoutLink({
			type: "subscription",
			productId: "prod_123",
			redirectUrl: "https://example.com/success",
			userId: "user_1",
		});

		expect(result).toBe("https://checkout.dodo.com/session123");
	});
});

describe("createCustomerPortalLink", () => {
	it("returns link from customer portal create", async () => {
		mockCustomers.customerPortal.create.mockResolvedValueOnce({
			link: "https://portal.dodo.com/customer123",
		});

		const result = await createCustomerPortalLink({
			customerId: "customer123",
		});

		expect(result).toBe("https://portal.dodo.com/customer123");
	});
});

describe("webhookHandler", () => {
	function makeRequest(
		body: string,
		overrideHeaders: Record<string, string> = {},
	) {
		const webhookSecret = "test-webhook-secret";
		const webhookId = "webhook-id-123";
		const webhookTimestamp = "2026-01-01T00:00:00Z";
		const payload = `${webhookId}.${webhookTimestamp}.${body}`;

		// Compute real HMAC synchronously for test
		const crypto = require("node:crypto");
		const sig = crypto
			.createHmac("sha256", webhookSecret)
			.update(payload)
			.digest("hex");

		const headers: Record<string, string> = {
			"webhook-id": webhookId,
			"webhook-signature": sig,
			"webhook-timestamp": webhookTimestamp,
			...overrideHeaders,
		};

		return {
			body: body,
			text: () => Promise.resolve(body),
			headers: {
				get: (key: string) => headers[key] ?? null,
			},
		} as unknown as Request;
	}

	it("returns 400 if webhook secret is missing", async () => {
		vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", "");
		const req = makeRequest("{}");
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
	});

	it("returns 400 if request body is missing", async () => {
		const req = {
			body: null,
			text: () => Promise.resolve(""),
			headers: { get: () => null },
		} as unknown as Request;
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
	});

	it("returns 400 if webhook headers are missing", async () => {
		const req = makeRequest("{}", {
			"webhook-id": "",
			"webhook-signature": "",
			"webhook-timestamp": "",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
	});

	it("returns 401 if webhook signature is invalid", async () => {
		const req = makeRequest("{}", {
			"webhook-signature": "invalid-signature",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(401);
	});

	it("handles checkout.session.completed with subscription_id", async () => {
		const body = JSON.stringify({
			type: "checkout.session.completed",
			data: {
				metadata: { organization_id: "org_1", user_id: "user_1" },
				customer: { customer_id: "cust_1" },
				subscription_id: "sub_123",
				product_id: "prod_123",
			},
		});
		const req = makeRequest(body);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({
				subscriptionId: "sub_123",
				type: "SUBSCRIPTION",
			}),
		);
	});

	it("handles checkout.session.completed without subscription_id (one-time)", async () => {
		const body = JSON.stringify({
			type: "checkout.session.completed",
			data: {
				metadata: { user_id: "user_1" },
				customer: { email: "test@example.com" },
				product_id: "prod_123",
			},
		});
		const req = makeRequest(body);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({ type: "ONE_TIME" }),
		);
	});

	it("handles subscription.updated event", async () => {
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValueOnce({
			id: "purchase_1",
		} as never);
		const body = JSON.stringify({
			type: "subscription.updated",
			data: {
				subscription_id: "sub_123",
				status: "active",
				product_id: "prod_123",
			},
		});
		const req = makeRequest(body);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(updatePurchase).toHaveBeenCalledWith(
			expect.objectContaining({ status: "active" }),
		);
	});

	it("handles subscription.cancelled event", async () => {
		const body = JSON.stringify({
			type: "subscription.cancelled",
			data: { subscription_id: "sub_123" },
		});
		const req = makeRequest(body);
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(deletePurchaseBySubscriptionId).toHaveBeenCalledWith("sub_123");
	});

	it("returns 200 for unhandled event types", async () => {
		const body = JSON.stringify({
			type: "unknown.event",
			data: {},
		});
		const req = makeRequest(body);
		const res = await webhookHandler(req);
		expect(res.status).toBe(200);
	});
});
