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
	creemFetch,
	webhookHandler,
} from "./index";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("creemFetch", () => {
	beforeEach(() => {
		vi.stubEnv("CREEM_API_KEY", "test-key");
		vi.stubEnv("NODE_ENV", "test");
	});
	afterEach(() => vi.unstubAllEnvs());

	it("throws if CREEM_API_KEY is missing", () => {
		vi.stubEnv("CREEM_API_KEY", "");
		expect(() => creemFetch("/test", {})).toThrow(
			"Missing env variable CREEM_API_KEY",
		);
	});

	it("calls fetch with x-api-key header", () => {
		mockFetch.mockResolvedValueOnce({ ok: true });
		creemFetch("/test", { method: "GET" });
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/test"),
			expect.objectContaining({
				headers: expect.objectContaining({ "x-api-key": "test-key" }),
			}),
		);
	});
});

describe("createCheckoutLink", () => {
	beforeEach(() => {
		vi.stubEnv("CREEM_API_KEY", "test-key");
		vi.stubEnv("NODE_ENV", "test");
	});
	afterEach(() => vi.unstubAllEnvs());

	it("returns checkout_url on success", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({ checkout_url: "https://pay.creem.io/abc" }),
		});
		const result = await createCheckoutLink({
			productId: "prod_1",
			redirectUrl: "https://example.com/success",
			userId: "u1",
			organizationId: null,
			seats: 1,
			email: "a@b.com",
			customerId: null,
		});
		expect(result).toBe("https://pay.creem.io/abc");
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve({ error: "bad" }),
		});
		await expect(
			createCheckoutLink({
				productId: "prod_1",
				redirectUrl: null,
				userId: "u1",
				organizationId: null,
				seats: 1,
				email: "a@b.com",
				customerId: null,
			}),
		).rejects.toThrow("Failed to create checkout link");
	});
});

describe("createCustomerPortalLink", () => {
	beforeEach(() => {
		vi.stubEnv("CREEM_API_KEY", "test-key");
		vi.stubEnv("NODE_ENV", "test");
	});
	afterEach(() => vi.unstubAllEnvs());

	it("returns customer_portal_link", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					customer_portal_link: "https://portal.creem.io/x",
				}),
		});
		const result = await createCustomerPortalLink({ customerId: "cust_1" });
		expect(result).toBe("https://portal.creem.io/x");
	});
});

describe("cancelSubscription", () => {
	beforeEach(() => {
		vi.stubEnv("CREEM_API_KEY", "test-key");
		vi.stubEnv("NODE_ENV", "test");
	});
	afterEach(() => vi.unstubAllEnvs());

	it("calls cancel endpoint", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});
		await cancelSubscription("sub_123");
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/subscriptions/sub_123/cancel"),
			expect.objectContaining({ method: "POST" }),
		);
	});
});

describe("webhookHandler", () => {
	const makeHmac = async (body: string, secret: string) => {
		const { createHmac } = await import("node:crypto");
		return createHmac("sha256", secret).update(body).digest("hex");
	};

	beforeEach(() => {
		vi.stubEnv("CREEM_WEBHOOK_SECRET", "whsec_test");
		vi.mocked(createPurchase).mockResolvedValue(undefined as never);
		vi.mocked(updatePurchase).mockResolvedValue(undefined as never);
		vi.mocked(deletePurchaseBySubscriptionId).mockResolvedValue(
			undefined as never,
		);
		vi.mocked(getPurchaseBySubscriptionId).mockResolvedValue(null as never);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("returns 405 for non-POST", async () => {
		const req = new Request("https://example.com/webhook", {
			method: "GET",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(405);
	});

	it("returns 400 for missing signature", async () => {
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid signature", async () => {
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body: "{}",
			headers: { "creem-signature": "bad-sig" },
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(400);
	});

	it("handles checkout.completed one-time event", async () => {
		const body = JSON.stringify({
			eventType: "checkout.completed",
			object: {
				object: "order",
				product: { id: "prod_1" },
				metadata: { user_id: "u1", organization_id: null },
				customer: "cust_1",
			},
		});
		const sig = await makeHmac(body, "whsec_test");
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body,
			headers: { "creem-signature": sig },
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({ type: "ONE_TIME", productId: "prod_1" }),
		);
	});

	it("handles subscription.active event (new)", async () => {
		const body = JSON.stringify({
			eventType: "subscription.active",
			object: {
				id: "sub_1",
				customer: { id: "cust_1" },
				product: { id: "prod_1", status: "active" },
				metadata: { user_id: "u1", organization_id: null },
			},
		});
		const sig = await makeHmac(body, "whsec_test");
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body,
			headers: { "creem-signature": sig },
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(createPurchase).toHaveBeenCalled();
	});

	it("handles subscription.canceled event", async () => {
		const body = JSON.stringify({
			eventType: "subscription.canceled",
			object: { id: "sub_1" },
		});
		const sig = await makeHmac(body, "whsec_test");
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body,
			headers: { "creem-signature": sig },
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(204);
		expect(deletePurchaseBySubscriptionId).toHaveBeenCalledWith("sub_1");
	});

	it("returns 200 for unhandled event type", async () => {
		const body = JSON.stringify({ eventType: "unknown.event", object: {} });
		const sig = await makeHmac(body, "whsec_test");
		const req = new Request("https://example.com/webhook", {
			method: "POST",
			body,
			headers: { "creem-signature": sig },
		});
		const res = await webhookHandler(req);
		expect(res.status).toBe(200);
	});
});
