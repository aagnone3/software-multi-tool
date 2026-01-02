import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	updateOrganization: vi.fn(),
	updateUser: vi.fn(),
	getOrganizationById: vi.fn(),
	getUserById: vi.fn(),
}));

const { updateOrganization, updateUser, getOrganizationById, getUserById } =
	mocks;

vi.mock("@repo/database", () => ({
	updateOrganization: mocks.updateOrganization,
	updateUser: mocks.updateUser,
	getOrganizationById: mocks.getOrganizationById,
	getUserById: mocks.getUserById,
}));

import { getCustomerIdFromEntity, setCustomerIdToEntity } from "./customer";

describe("customer helpers", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	it("assigns customer id to an organization", async () => {
		await setCustomerIdToEntity("cus_1", { organizationId: "org_1" });

		expect(updateOrganization).toHaveBeenCalledWith({
			id: "org_1",
			paymentsCustomerId: "cus_1",
		});
		expect(updateUser).not.toHaveBeenCalled();
	});

	it("assigns customer id to a user when organization not provided", async () => {
		await setCustomerIdToEntity("cus_2", { userId: "user_1" });

		expect(updateUser).toHaveBeenCalledWith({
			id: "user_1",
			paymentsCustomerId: "cus_2",
		});
	});

	it("returns customer id for organization and user lookups", async () => {
		getOrganizationById.mockResolvedValueOnce({
			paymentsCustomerId: "cus_org",
		});
		const organizationId = await getCustomerIdFromEntity({
			organizationId: "org_2",
		});
		expect(organizationId).toBe("cus_org");

		getUserById.mockResolvedValueOnce({
			paymentsCustomerId: "cus_user",
		});
		const userId = await getCustomerIdFromEntity({ userId: "user_2" });
		expect(userId).toBe("cus_user");
	});

	it("returns null when customer id not set", async () => {
		getOrganizationById.mockResolvedValueOnce({ paymentsCustomerId: null });
		const orgMissing = await getCustomerIdFromEntity({
			organizationId: "org_missing",
		});
		expect(orgMissing).toBeNull();

		getUserById.mockResolvedValueOnce(undefined);
		const userMissing = await getCustomerIdFromEntity({
			userId: "user_missing",
		});
		expect(userMissing).toBeNull();
	});
});
