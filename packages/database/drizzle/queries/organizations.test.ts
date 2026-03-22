import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	orgFindMany: vi.fn(),
	orgFindFirst: vi.fn(),
	orgCount: vi.fn(),
	orgUpdate: vi.fn(),
	invFindFirst: vi.fn(),
	memberFindFirst: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		query: {
			organization: {
				findMany: mocks.orgFindMany,
				findFirst: mocks.orgFindFirst,
			},
			invitation: {
				findFirst: mocks.invFindFirst,
			},
			member: {
				findFirst: mocks.memberFindFirst,
			},
		},
		$count: mocks.orgCount,
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: mocks.orgUpdate,
			})),
		})),
	},
}));

import {
	countAllOrganizations,
	getInvitationById,
	getOrganizationById,
	getOrganizationBySlug,
	getOrganizationMembership,
	getOrganizations,
	getPendingInvitationByEmail,
	updateOrganization,
} from "./organizations";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getOrganizations", () => {
	it("returns list of organizations", async () => {
		mocks.orgFindMany.mockResolvedValueOnce([{ id: "o1" }]);
		const result = await getOrganizations({ limit: 10, offset: 0 });
		expect(result).toEqual([{ id: "o1" }]);
	});

	it("passes query filter", async () => {
		mocks.orgFindMany.mockResolvedValueOnce([]);
		await getOrganizations({ limit: 10, offset: 0, query: "acme" });
		expect(mocks.orgFindMany).toHaveBeenCalledOnce();
	});
});

describe("countAllOrganizations", () => {
	it("returns the count", async () => {
		mocks.orgCount.mockResolvedValueOnce(3);
		const result = await countAllOrganizations();
		expect(result).toBe(3);
	});
});

describe("getOrganizationById", () => {
	it("returns organization by id", async () => {
		mocks.orgFindFirst.mockResolvedValueOnce({ id: "o2" });
		const result = await getOrganizationById("o2");
		expect(result).toEqual({ id: "o2" });
	});
});

describe("getInvitationById", () => {
	it("returns invitation by id", async () => {
		mocks.invFindFirst.mockResolvedValueOnce({ id: "inv1" });
		const result = await getInvitationById("inv1");
		expect(result).toEqual({ id: "inv1" });
	});
});

describe("getOrganizationBySlug", () => {
	it("returns organization by slug", async () => {
		mocks.orgFindFirst.mockResolvedValueOnce({ id: "o3", slug: "acme" });
		const result = await getOrganizationBySlug("acme");
		expect(result).toEqual({ id: "o3", slug: "acme" });
	});
});

describe("getOrganizationMembership", () => {
	it("returns membership for user in org", async () => {
		mocks.memberFindFirst.mockResolvedValueOnce({ id: "m1" });
		const result = await getOrganizationMembership("org1", "u1");
		expect(result).toEqual({ id: "m1" });
	});
});

describe("getPendingInvitationByEmail", () => {
	it("returns pending invitation by email", async () => {
		mocks.invFindFirst.mockResolvedValueOnce({
			id: "inv2",
			status: "pending",
		});
		const result = await getPendingInvitationByEmail("user@example.com");
		expect(result).toEqual({ id: "inv2", status: "pending" });
	});
});

describe("updateOrganization", () => {
	it("calls update with org data", async () => {
		mocks.orgUpdate.mockResolvedValueOnce(undefined);
		await updateOrganization({ id: "o4", name: "Renamed" });
		expect(mocks.orgUpdate).toHaveBeenCalledOnce();
	});
});
