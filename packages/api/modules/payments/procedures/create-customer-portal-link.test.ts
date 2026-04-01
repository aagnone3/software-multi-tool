import { ORPCError } from "@orpc/client";
import { getOrganizationMembership, getPurchaseById } from "@repo/database";
import { createCustomerPortalLink as createCustomerPortalLinkFn } from "@repo/payments";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getPurchaseById: vi.fn(),
	getOrganizationMembership: vi.fn(),
}));

vi.mock("@repo/payments", () => ({
	createCustomerPortalLink: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn() },
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { purchaseId: string; redirectUrl?: string };
	context: { headers: Headers; user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { createCustomerPortalLink } = await import(
		"./create-customer-portal-link"
	);
	const handler = (
		createCustomerPortalLink as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

const userSession = {
	session: { id: "s1" },
	user: { id: "user-1", role: "user", email: "user@example.com" },
};

describe("createCustomerPortalLink procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(userSession);
	});

	it("throws FORBIDDEN when purchase not found", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: { purchaseId: "missing" },
				context: { headers: new Headers(), user: { id: "user-1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when user is not the purchase owner (personal purchase)", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue({
			id: "p1",
			userId: "other-user",
			organizationId: null,
			customerId: "cus_1",
			subscriptionId: null,
		} as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: { purchaseId: "p1" },
				context: { headers: new Headers(), user: { id: "user-1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("throws FORBIDDEN when user is not org owner for org purchase", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue({
			id: "p1",
			userId: null,
			organizationId: "org-1",
			customerId: "cus_1",
			subscriptionId: null,
		} as never);
		vi.mocked(getOrganizationMembership).mockResolvedValue({
			role: "member",
		} as never);

		const handler = await getHandler();
		await expect(
			handler({
				input: { purchaseId: "p1" },
				context: { headers: new Headers(), user: { id: "user-1" } },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("returns portal link for org owner", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue({
			id: "p1",
			userId: null,
			organizationId: "org-1",
			customerId: "cus_1",
			subscriptionId: "sub_1",
		} as never);
		vi.mocked(getOrganizationMembership).mockResolvedValue({
			role: "owner",
		} as never);
		vi.mocked(createCustomerPortalLinkFn).mockResolvedValue(
			"https://billing.stripe.com/portal/xyz",
		);

		const handler = await getHandler();
		const result = await handler({
			input: { purchaseId: "p1", redirectUrl: "https://example.com" },
			context: { headers: new Headers(), user: { id: "user-1" } },
		});

		expect(result).toEqual({
			customerPortalLink: "https://billing.stripe.com/portal/xyz",
		});
	});

	it("returns portal link for personal purchase owner", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue({
			id: "p1",
			userId: "user-1",
			organizationId: null,
			customerId: "cus_1",
			subscriptionId: null,
		} as never);
		vi.mocked(createCustomerPortalLinkFn).mockResolvedValue(
			"https://billing.stripe.com/portal/abc",
		);

		const handler = await getHandler();
		const result = await handler({
			input: { purchaseId: "p1" },
			context: { headers: new Headers(), user: { id: "user-1" } },
		});

		expect(result).toEqual({
			customerPortalLink: "https://billing.stripe.com/portal/abc",
		});
	});

	it("throws INTERNAL_SERVER_ERROR when portal link creation fails", async () => {
		vi.mocked(getPurchaseById).mockResolvedValue({
			id: "p1",
			userId: "user-1",
			organizationId: null,
			customerId: "cus_1",
			subscriptionId: null,
		} as never);
		vi.mocked(createCustomerPortalLinkFn).mockRejectedValue(
			new Error("Stripe error"),
		);

		const handler = await getHandler();
		await expect(
			handler({
				input: { purchaseId: "p1" },
				context: { headers: new Headers(), user: { id: "user-1" } },
			}),
		).rejects.toThrow(ORPCError);
	});
});
