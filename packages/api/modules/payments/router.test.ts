import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockPaymentsModule,
	paymentsFixture,
	resetExternalServicesMocks,
} from "../../../../tests/fixtures/external-services";
import { paymentsRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getOrganizationByIdMock = vi.hoisted(() => vi.fn());
const getPurchaseByIdMock = vi.hoisted(() => vi.fn());
const getOrganizationMembershipMock = vi.hoisted(() => vi.fn());
const getPurchasesByOrganizationIdMock = vi.hoisted(() => vi.fn());
const getPurchasesByUserIdMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getOrganizationById: getOrganizationByIdMock,
	getPurchaseById: getPurchaseByIdMock,
	getOrganizationMembership: getOrganizationMembershipMock,
	getPurchasesByOrganizationId: getPurchasesByOrganizationIdMock,
	getPurchasesByUserId: getPurchasesByUserIdMock,
}));

vi.mock("@repo/payments", () => mockPaymentsModule());

describe("Payments Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetExternalServicesMocks();

		getSessionMock.mockResolvedValue({
			user: {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				role: "member",
			},
			session: { id: "session-1" },
		});
	});

	describe("payments.createCheckoutLink", () => {
		const createClient = () =>
			createProcedureClient(paymentsRouter.createCheckoutLink, {
				context: {
					headers: new Headers({
						"accept-language": "en",
					}),
				},
			});

		it("creates checkout link for one-time purchase", async () => {
			paymentsFixture.getCustomerIdFromEntity.mockResolvedValue(null);

			const client = createClient();
			const result = await client({
				type: "one-time",
				productId: "prod_123",
			});

			expect(result).toEqual({
				checkoutLink: "https://payments.test/checkout",
			});
			expect(paymentsFixture.createCheckoutLink).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "one-time",
					productId: "prod_123",
					email: "test@example.com",
					name: "Test User",
					userId: "user-123",
				}),
			);
		});

		it("creates checkout link for subscription", async () => {
			paymentsFixture.getCustomerIdFromEntity.mockResolvedValue(null);

			const client = createClient();
			const result = await client({
				type: "subscription",
				productId: "prod_456",
				redirectUrl: "https://app.example.com/success",
			});

			expect(result).toEqual({
				checkoutLink: "https://payments.test/checkout",
			});
			expect(paymentsFixture.createCheckoutLink).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "subscription",
					productId: "prod_456",
					redirectUrl: "https://app.example.com/success",
				}),
			);
		});

		it("creates checkout link for organization", async () => {
			paymentsFixture.getCustomerIdFromEntity.mockResolvedValue(null);
			getOrganizationByIdMock.mockResolvedValue({
				id: "org-123",
				members: [{}, {}, {}], // 3 members
			});

			const client = createClient();
			await client({
				type: "subscription",
				productId: "prod_789",
				organizationId: "org-123",
			});

			expect(paymentsFixture.createCheckoutLink).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-123",
				}),
			);
		});

		it("throws NOT_FOUND when organization does not exist", async () => {
			getOrganizationByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					type: "subscription",
					productId: "prod_123",
					organizationId: "non-existent-org",
				}),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws INTERNAL_SERVER_ERROR when checkout link creation fails", async () => {
			paymentsFixture.getCustomerIdFromEntity.mockResolvedValue(null);
			paymentsFixture.createCheckoutLink.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					type: "one-time",
					productId: "prod_123",
				}),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				paymentsRouter.createCheckoutLink,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(
				client({
					type: "one-time",
					productId: "prod_123",
				}),
			).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("payments.createCustomerPortalLink", () => {
		const createClient = () =>
			createProcedureClient(paymentsRouter.createCustomerPortalLink, {
				context: {
					headers: new Headers({
						"accept-language": "en",
					}),
				},
			});

		it("creates customer portal link for user purchase", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				userId: "user-123",
				customerId: "cus_123",
				subscriptionId: "sub_123",
			});

			const client = createClient();
			const result = await client({
				purchaseId: "purchase-123",
			});

			expect(result).toEqual({
				customerPortalLink: "https://payments.test/portal",
			});
			expect(
				paymentsFixture.createCustomerPortalLink,
			).toHaveBeenCalledWith({
				subscriptionId: "sub_123",
				customerId: "cus_123",
				redirectUrl: undefined,
			});
		});

		it("creates portal link with redirect URL", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				userId: "user-123",
				customerId: "cus_123",
				subscriptionId: "sub_123",
			});

			const client = createClient();
			await client({
				purchaseId: "purchase-123",
				redirectUrl: "https://app.example.com/billing",
			});

			expect(
				paymentsFixture.createCustomerPortalLink,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					redirectUrl: "https://app.example.com/billing",
				}),
			);
		});

		it("allows organization owner to access portal link", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				organizationId: "org-123",
				customerId: "cus_123",
				subscriptionId: "sub_123",
			});
			getOrganizationMembershipMock.mockResolvedValue({
				role: "owner",
			});

			const client = createClient();
			const result = await client({
				purchaseId: "purchase-123",
			});

			expect(result).toEqual({
				customerPortalLink: "https://payments.test/portal",
			});
		});

		it("throws FORBIDDEN when purchase does not exist", async () => {
			getPurchaseByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					purchaseId: "non-existent",
				}),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws FORBIDDEN when user is not organization owner", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				organizationId: "org-123",
				customerId: "cus_123",
			});
			getOrganizationMembershipMock.mockResolvedValue({
				role: "member",
			});

			const client = createClient();

			await expect(
				client({
					purchaseId: "purchase-123",
				}),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws FORBIDDEN when purchase belongs to different user", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				userId: "different-user",
				customerId: "cus_123",
			});

			const client = createClient();

			await expect(
				client({
					purchaseId: "purchase-123",
				}),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws INTERNAL_SERVER_ERROR when portal link creation fails", async () => {
			getPurchaseByIdMock.mockResolvedValue({
				id: "purchase-123",
				userId: "user-123",
				customerId: "cus_123",
			});
			paymentsFixture.createCustomerPortalLink.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					purchaseId: "purchase-123",
				}),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});
		});
	});

	describe("payments.listPurchases", () => {
		const createClient = () =>
			createProcedureClient(paymentsRouter.listPurchases, {
				context: {
					headers: new Headers(),
				},
			});

		it("lists user purchases when no organization specified", async () => {
			const mockPurchases = [
				{ id: "purchase-1", userId: "user-123" },
				{ id: "purchase-2", userId: "user-123" },
			];
			getPurchasesByUserIdMock.mockResolvedValue(mockPurchases);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ purchases: mockPurchases });
			expect(getPurchasesByUserIdMock).toHaveBeenCalledWith("user-123");
		});

		it("lists organization purchases when organization specified", async () => {
			const mockPurchases = [
				{ id: "purchase-1", organizationId: "org-123" },
			];
			getPurchasesByOrganizationIdMock.mockResolvedValue(mockPurchases);

			const client = createClient();
			const result = await client({ organizationId: "org-123" });

			expect(result).toEqual({ purchases: mockPurchases });
			expect(getPurchasesByOrganizationIdMock).toHaveBeenCalledWith(
				"org-123",
			);
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(paymentsRouter.listPurchases, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
