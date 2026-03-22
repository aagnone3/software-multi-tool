import { describe, expect, it, vi } from "vitest";

// server-only is a stub in test env
vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
const mockGetFullOrganization = vi.fn();
const mockListOrganizations = vi.fn();
const mockListUserAccounts = vi.fn();
const mockListPasskeys = vi.fn();

vi.mock("@repo/auth", () => ({
	auth: {
		api: {
			getSession: (...args: unknown[]) => mockGetSession(...args),
			getFullOrganization: (...args: unknown[]) =>
				mockGetFullOrganization(...args),
			listOrganizations: (...args: unknown[]) =>
				mockListOrganizations(...args),
			listUserAccounts: (...args: unknown[]) =>
				mockListUserAccounts(...args),
			listPasskeys: (...args: unknown[]) => mockListPasskeys(...args),
		},
	},
}));

const mockGetInvitationById = vi.fn();
vi.mock("@repo/database", () => ({
	getInvitationById: (...args: unknown[]) => mockGetInvitationById(...args),
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe("auth server utils", () => {
	// Note: these functions use React.cache so we import them fresh each test via resetModules

	it("getSession returns session data", async () => {
		const session = { user: { id: "u1" }, session: { id: "s1" } };
		mockGetSession.mockResolvedValue(session);
		vi.resetModules();
		const { getSession } = await import("./server");
		const result = await getSession();
		expect(result).toEqual(session);
	});

	it("getActiveOrganization returns organization", async () => {
		const org = { id: "org1", slug: "my-org" };
		mockGetFullOrganization.mockResolvedValue(org);
		vi.resetModules();
		const { getActiveOrganization } = await import("./server");
		const result = await getActiveOrganization("my-org");
		expect(result).toEqual(org);
	});

	it("getActiveOrganization returns null on error", async () => {
		mockGetFullOrganization.mockRejectedValue(new Error("not found"));
		vi.resetModules();
		const { getActiveOrganization } = await import("./server");
		const result = await getActiveOrganization("bad-slug");
		expect(result).toBeNull();
	});

	it("getOrganizationList returns list", async () => {
		const orgs = [{ id: "org1" }];
		mockListOrganizations.mockResolvedValue(orgs);
		vi.resetModules();
		const { getOrganizationList } = await import("./server");
		const result = await getOrganizationList();
		expect(result).toEqual(orgs);
	});

	it("getOrganizationList returns empty array on error", async () => {
		mockListOrganizations.mockRejectedValue(new Error("fail"));
		vi.resetModules();
		const { getOrganizationList } = await import("./server");
		const result = await getOrganizationList();
		expect(result).toEqual([]);
	});

	it("getUserAccounts returns accounts", async () => {
		const accounts = [{ id: "acc1" }];
		mockListUserAccounts.mockResolvedValue(accounts);
		vi.resetModules();
		const { getUserAccounts } = await import("./server");
		const result = await getUserAccounts();
		expect(result).toEqual(accounts);
	});

	it("getUserAccounts returns empty array on error", async () => {
		mockListUserAccounts.mockRejectedValue(new Error("fail"));
		vi.resetModules();
		const { getUserAccounts } = await import("./server");
		const result = await getUserAccounts();
		expect(result).toEqual([]);
	});

	it("getUserPasskeys returns passkeys", async () => {
		const passkeys = [{ id: "pk1" }];
		mockListPasskeys.mockResolvedValue(passkeys);
		vi.resetModules();
		const { getUserPasskeys } = await import("./server");
		const result = await getUserPasskeys();
		expect(result).toEqual(passkeys);
	});

	it("getUserPasskeys returns empty array on error", async () => {
		mockListPasskeys.mockRejectedValue(new Error("fail"));
		vi.resetModules();
		const { getUserPasskeys } = await import("./server");
		const result = await getUserPasskeys();
		expect(result).toEqual([]);
	});

	it("getInvitation returns invitation", async () => {
		const invitation = { id: "inv1" };
		mockGetInvitationById.mockResolvedValue(invitation);
		vi.resetModules();
		const { getInvitation } = await import("./server");
		const result = await getInvitation("inv1");
		expect(result).toEqual(invitation);
	});

	it("getInvitation returns null on error", async () => {
		mockGetInvitationById.mockRejectedValue(new Error("not found"));
		vi.resetModules();
		const { getInvitation } = await import("./server");
		const result = await getInvitation("bad-id");
		expect(result).toBeNull();
	});
});
