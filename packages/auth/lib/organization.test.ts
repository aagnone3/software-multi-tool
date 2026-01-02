import { describe, expect, it, vi } from "vitest";
import {
	paymentsFixture,
	resetExternalServicesMocks,
} from "../../../tests/fixtures/external-services";

const { getOrganizationWithPurchasesAndMembersCount, loggerError } = vi.hoisted(
	() => ({
		getOrganizationWithPurchasesAndMembersCount: vi.fn(),
		loggerError: vi.fn(),
	}),
);

vi.mock("@repo/payments", async () => {
	const { mockPaymentsModule } = await import(
		"../../../tests/fixtures/external-services"
	);
	return mockPaymentsModule();
});

vi.mock("@repo/database", () => ({
	getOrganizationWithPurchasesAndMembersCount,
}));

vi.mock("@repo/logs", () => ({
	logger: {
		error: loggerError,
	},
}));

import { updateSeatsInOrganizationSubscription } from "./organization";

describe("updateSeatsInOrganizationSubscription", () => {
	beforeEach(() => {
		getOrganizationWithPurchasesAndMembersCount.mockReset();
		resetExternalServicesMocks();
		loggerError.mockReset();
	});

	it("updates subscription seats when an active subscription exists", async () => {
		getOrganizationWithPurchasesAndMembersCount.mockResolvedValueOnce({
			purchases: [
				{ type: "OTHER" },
				{
					type: "SUBSCRIPTION",
					subscriptionId: "sub_123",
				},
			],
			membersCount: 5,
		});

		await updateSeatsInOrganizationSubscription("org_1");

		expect(paymentsFixture.setSubscriptionSeats).toHaveBeenCalledWith({
			id: "sub_123",
			seats: 5,
		});
	});

	it("logs and swallows errors from the payments provider", async () => {
		getOrganizationWithPurchasesAndMembersCount.mockResolvedValueOnce({
			purchases: [
				{
					type: "SUBSCRIPTION",
					subscriptionId: "sub_456",
				},
			],
			membersCount: 3,
		});
		paymentsFixture.setSubscriptionSeats.mockRejectedValueOnce(
			new Error("boom"),
		);

		await updateSeatsInOrganizationSubscription("org_2");

		expect(loggerError).toHaveBeenCalledWith(
			"Could not update seats in organization subscription",
			expect.objectContaining({ organizationId: "org_2" }),
		);
	});

	it("exits early when there is no organization data", async () => {
		getOrganizationWithPurchasesAndMembersCount.mockResolvedValueOnce(null);

		await updateSeatsInOrganizationSubscription("org_3");

		expect(paymentsFixture.setSubscriptionSeats).not.toHaveBeenCalled();
	});

	it("exits early when the organization has no purchases", async () => {
		getOrganizationWithPurchasesAndMembersCount.mockResolvedValueOnce({
			purchases: [],
			membersCount: 1,
		});

		await updateSeatsInOrganizationSubscription("org_4");

		expect(paymentsFixture.setSubscriptionSeats).not.toHaveBeenCalled();
	});

	it("exits early when the active subscription lacks an id", async () => {
		getOrganizationWithPurchasesAndMembersCount.mockResolvedValueOnce({
			purchases: [
				{
					type: "SUBSCRIPTION",
					subscriptionId: null,
				},
			],
			membersCount: 10,
		});

		await updateSeatsInOrganizationSubscription("org_5");

		expect(paymentsFixture.setSubscriptionSeats).not.toHaveBeenCalled();
	});
});
