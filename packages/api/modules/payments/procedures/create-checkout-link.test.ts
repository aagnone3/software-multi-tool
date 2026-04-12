import { ORPCError } from "@orpc/client";
import { getOrganizationById } from "@repo/database";
import {
	createCheckoutLink as createCheckoutLinkFn,
	getCustomerIdFromEntity,
} from "@repo/payments";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getOrganizationById: vi.fn(),
}));

vi.mock("@repo/payments", () => ({
	createCheckoutLink: vi.fn(),
	getCustomerIdFromEntity: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn() },
}));

vi.mock("@repo/config", () => ({
	config: {
		payments: {
			plans: {
				pro: {
					id: "pro",
					prices: [
						{ productId: "prod_pro_monthly", trialPeriodDays: 7 },
					],
				},
				starter: {
					id: "starter",
					prices: [{ productId: "prod_starter" }],
				},
			},
		},
	},
}));

const mockAuth = {
	api: { getSession: vi.fn() },
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

// Middleware mocks
vi.mock("../../../orpc/middleware/locale-middleware", () => ({
	localeMiddleware: {
		middleware: vi.fn(
			(
				_input: unknown,
				context: unknown,
				next: (ctx: { context: unknown }) => Promise<unknown>,
			) => next({ context }),
		),
	},
}));

type Handler = (ctx: {
	input: {
		type: "one-time" | "subscription";
		productId: string;
		redirectUrl?: string;
		organizationId?: string;
	};
	context: {
		headers: Headers;
		user: { id: string; email: string; name?: string };
	};
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { createCheckoutLink } = await import("./create-checkout-link");
	const handler = (
		createCheckoutLink as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

const mockUser = {
	id: "user-123",
	email: "user@example.com",
	name: "Test User",
};

const mockSession = {
	session: { id: "session-1" },
	user: mockUser,
};

describe("createCheckoutLink procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(mockSession);
	});

	it("returns a checkout link for a user purchase (no organizationId)", async () => {
		vi.mocked(getCustomerIdFromEntity).mockResolvedValue("cus_123");
		vi.mocked(createCheckoutLinkFn).mockResolvedValue(
			"https://checkout.stripe.com/session",
		);

		const handler = await getHandler();
		const result = await handler({
			input: { type: "subscription", productId: "prod_pro_monthly" },
			context: { headers: new Headers(), user: mockUser },
		});

		expect(result).toEqual({
			checkoutLink: "https://checkout.stripe.com/session",
		});
		expect(getCustomerIdFromEntity).toHaveBeenCalledWith({
			userId: mockUser.id,
		});
		expect(createCheckoutLinkFn).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "subscription",
				productId: "prod_pro_monthly",
				email: mockUser.email,
				userId: mockUser.id,
				customerId: "cus_123",
				trialPeriodDays: 7,
			}),
		);
	});

	it("returns a checkout link for an organization purchase", async () => {
		const mockOrg = { id: "org-1", members: [{ id: "m1" }, { id: "m2" }] };
		vi.mocked(getOrganizationById).mockResolvedValue(mockOrg as never);
		vi.mocked(getCustomerIdFromEntity).mockResolvedValue(null);
		vi.mocked(createCheckoutLinkFn).mockResolvedValue(
			"https://checkout.stripe.com/org-session",
		);

		const handler = await getHandler();
		const result = await handler({
			input: {
				type: "subscription",
				productId: "prod_pro_monthly",
				organizationId: "org-1",
			},
			context: { headers: new Headers(), user: mockUser },
		});

		expect(result).toEqual({
			checkoutLink: "https://checkout.stripe.com/org-session",
		});
		expect(getOrganizationById).toHaveBeenCalledWith("org-1");
		expect(getCustomerIdFromEntity).toHaveBeenCalledWith({
			organizationId: "org-1",
		});
		expect(createCheckoutLinkFn).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: "org-1",
				customerId: undefined,
			}),
		);
	});

	it("throws NOT_FOUND when organization does not exist", async () => {
		vi.mocked(getOrganizationById).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: {
					type: "subscription",
					productId: "prod_pro_monthly",
					organizationId: "nonexistent-org",
				},
				context: { headers: new Headers(), user: mockUser },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws INTERNAL_SERVER_ERROR when createCheckoutLink returns null", async () => {
		vi.mocked(getCustomerIdFromEntity).mockResolvedValue(null);
		vi.mocked(createCheckoutLinkFn).mockResolvedValue(null as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: { type: "subscription", productId: "prod_pro_monthly" },
				context: { headers: new Headers(), user: mockUser },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws INTERNAL_SERVER_ERROR when createCheckoutLink throws", async () => {
		vi.mocked(getCustomerIdFromEntity).mockResolvedValue("cus_abc");
		vi.mocked(createCheckoutLinkFn).mockRejectedValue(
			new Error("Stripe error"),
		);

		const handler = await getHandler();
		await expect(
			handler({
				input: { type: "one-time", productId: "prod_starter" },
				context: { headers: new Headers(), user: mockUser },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("passes redirectUrl to checkout link creation", async () => {
		vi.mocked(getCustomerIdFromEntity).mockResolvedValue(null);
		vi.mocked(createCheckoutLinkFn).mockResolvedValue(
			"https://checkout.stripe.com/redirect-session",
		);

		const handler = await getHandler();
		const result = await handler({
			input: {
				type: "one-time",
				productId: "prod_starter",
				redirectUrl: "https://app.example.com/success",
			},
			context: { headers: new Headers(), user: mockUser },
		});

		expect(result).toEqual({
			checkoutLink: "https://checkout.stripe.com/redirect-session",
		});
		expect(createCheckoutLinkFn).toHaveBeenCalledWith(
			expect.objectContaining({
				redirectUrl: "https://app.example.com/success",
			}),
		);
	});
});
