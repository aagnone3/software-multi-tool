import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	organizationFindMany: vi.fn(),
	organizationFindUnique: vi.fn(),
	invitationFindUnique: vi.fn(),
	memberFindUnique: vi.fn(),
}));

const {
	organizationFindMany,
	organizationFindUnique,
	invitationFindUnique,
	memberFindUnique,
} = mocks;

vi.mock("../client", () => ({
	db: {
		organization: {
			findMany: mocks.organizationFindMany,
			findUnique: mocks.organizationFindUnique,
		},
		invitation: {
			findUnique: mocks.invitationFindUnique,
		},
		member: {
			findUnique: mocks.memberFindUnique,
		},
	},
}));

import {
	getInvitationById,
	getOrganizationById,
	getOrganizationMembership,
	getOrganizations,
	getOrganizationWithPurchasesAndMembersCount,
} from "./organizations";

describe("organizations queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	it("maps organizations with member counts", async () => {
		organizationFindMany.mockResolvedValueOnce([
			{
				id: "org1",
				name: "Org 1",
				_count: { members: 2 },
			},
		]);

		const result = await getOrganizations({
			limit: 10,
			offset: 0,
		});

		expect(result[0]).toEqual(expect.objectContaining({ membersCount: 2 }));
		expect(organizationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				take: 10,
				skip: 0,
			}),
		);
	});

	it("returns organization with purchases and members count", async () => {
		organizationFindUnique.mockResolvedValueOnce({
			id: "org2",
			_count: { members: 5 },
			purchases: [],
		});

		const result =
			await getOrganizationWithPurchasesAndMembersCount("org2");

		expect(result).toEqual(
			expect.objectContaining({ membersCount: 5, id: "org2" }),
		);
	});

	it("returns null when organization not found", async () => {
		organizationFindUnique.mockResolvedValueOnce(null);
		const result =
			await getOrganizationWithPurchasesAndMembersCount("missing");
		expect(result).toBeNull();
	});

	it("forwards simple fetch helpers to prisma client", async () => {
		await getOrganizationById("org3");
		expect(organizationFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "org3" },
			}),
		);

		await getInvitationById("invite1");
		expect(invitationFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "invite1" },
			}),
		);

		await getOrganizationMembership("org4", "user1");
		expect(memberFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					organizationId_userId: {
						organizationId: "org4",
						userId: "user1",
					},
				},
			}),
		);
	});
});
