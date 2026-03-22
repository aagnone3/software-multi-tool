import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOrganizationMembershipMock } = vi.hoisted(() => ({
	getOrganizationMembershipMock: vi.fn(),
}));

vi.mock("@repo/database", async () => {
	const { z } = await import("zod");
	return {
		getOrganizationMembership: getOrganizationMembershipMock,
		db: {},
		zodSchemas: {
			AuditActionSchema: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]),
		},
	};
});

import { verifyOrganizationMembership } from "./membership";

describe("verifyOrganizationMembership", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when membership not found", async () => {
		getOrganizationMembershipMock.mockResolvedValue(null);

		const result = await verifyOrganizationMembership("org-1", "user-1");

		expect(result).toBeNull();
		expect(getOrganizationMembershipMock).toHaveBeenCalledWith(
			"org-1",
			"user-1",
		);
	});

	it("returns organization and role when membership found", async () => {
		const mockMembership = {
			organization: { id: "org-1", name: "Acme" },
			role: "admin",
		};
		getOrganizationMembershipMock.mockResolvedValue(mockMembership);

		const result = await verifyOrganizationMembership("org-1", "user-1");

		expect(result).toEqual({
			organization: { id: "org-1", name: "Acme" },
			role: "admin",
		});
	});

	it("passes organizationId and userId to database", async () => {
		getOrganizationMembershipMock.mockResolvedValue({
			organization: { id: "org-2" },
			role: "member",
		});

		await verifyOrganizationMembership("org-2", "user-5");

		expect(getOrganizationMembershipMock).toHaveBeenCalledWith(
			"org-2",
			"user-5",
		);
	});
});
