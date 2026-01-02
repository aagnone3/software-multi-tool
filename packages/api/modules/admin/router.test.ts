import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getUsersMock = vi.hoisted(() => vi.fn());
const countAllUsersMock = vi.hoisted(() => vi.fn());
const getOrganizationsMock = vi.hoisted(() => vi.fn());
const countAllOrganizationsMock = vi.hoisted(() => vi.fn());
const getOrganizationByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getUsers: getUsersMock,
	countAllUsers: countAllUsersMock,
	getOrganizations: getOrganizationsMock,
	countAllOrganizations: countAllOrganizationsMock,
	getOrganizationById: getOrganizationByIdMock,
}));

describe("Admin Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("admin.users.list", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: { id: "session-1" },
			});

			return createProcedureClient(adminRouter.users.list, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("lists users with default pagination", async () => {
			const mockUsers = [
				{ id: "user-1", email: "user1@example.com" },
				{ id: "user-2", email: "user2@example.com" },
			];
			getUsersMock.mockResolvedValue(mockUsers);
			countAllUsersMock.mockResolvedValue(50);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ users: mockUsers, total: 50 });
			expect(getUsersMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				query: undefined,
			});
		});

		it("lists users with custom pagination", async () => {
			getUsersMock.mockResolvedValue([]);
			countAllUsersMock.mockResolvedValue(100);

			const client = createClient();
			const result = await client({ limit: 25, offset: 50 });

			expect(result).toEqual({ users: [], total: 100 });
			expect(getUsersMock).toHaveBeenCalledWith({
				limit: 25,
				offset: 50,
				query: undefined,
			});
		});

		it("lists users with search query", async () => {
			const mockUsers = [
				{ id: "user-1", email: "john@example.com", name: "John Doe" },
			];
			getUsersMock.mockResolvedValue(mockUsers);
			countAllUsersMock.mockResolvedValue(1);

			const client = createClient();
			const result = await client({ query: "john" });

			expect(result).toEqual({ users: mockUsers, total: 1 });
			expect(getUsersMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				query: "john",
			});
		});

		it("enforces max limit of 100", async () => {
			const client = createClient();

			await expect(client({ limit: 150 })).rejects.toThrow();
		});

		it("enforces min limit of 1", async () => {
			const client = createClient();

			await expect(client({ limit: 0 })).rejects.toThrow();
		});

		it("throws FORBIDDEN when user is not admin", async () => {
			const client = createClient("member");

			await expect(client({})).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(adminRouter.users.list, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("admin.organizations.list", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: { id: "session-1" },
			});

			return createProcedureClient(adminRouter.organizations.list, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("lists organizations with default pagination", async () => {
			const mockOrgs = [
				{ id: "org-1", name: "Org 1" },
				{ id: "org-2", name: "Org 2" },
			];
			getOrganizationsMock.mockResolvedValue(mockOrgs);
			countAllOrganizationsMock.mockResolvedValue(20);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ organizations: mockOrgs, total: 20 });
			expect(getOrganizationsMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				query: undefined,
			});
		});

		it("lists organizations with custom pagination", async () => {
			getOrganizationsMock.mockResolvedValue([]);
			countAllOrganizationsMock.mockResolvedValue(100);

			const client = createClient();
			const result = await client({ limit: 50, offset: 25 });

			expect(result).toEqual({ organizations: [], total: 100 });
			expect(getOrganizationsMock).toHaveBeenCalledWith({
				limit: 50,
				offset: 25,
				query: undefined,
			});
		});

		it("lists organizations with search query", async () => {
			const mockOrgs = [{ id: "org-1", name: "Acme Corp" }];
			getOrganizationsMock.mockResolvedValue(mockOrgs);
			countAllOrganizationsMock.mockResolvedValue(1);

			const client = createClient();
			const result = await client({ query: "acme" });

			expect(result).toEqual({ organizations: mockOrgs, total: 1 });
			expect(getOrganizationsMock).toHaveBeenCalledWith({
				limit: 10,
				offset: 0,
				query: "acme",
			});
		});

		it("throws FORBIDDEN when user is not admin", async () => {
			const client = createClient("member");

			await expect(client({})).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});

	describe("admin.organizations.find", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: { id: "session-1" },
			});

			return createProcedureClient(adminRouter.organizations.find, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("finds organization by id", async () => {
			const mockOrg = { id: "org-123", name: "Test Organization" };
			getOrganizationByIdMock.mockResolvedValue(mockOrg);

			const client = createClient();
			const result = await client({ id: "org-123" });

			expect(result).toEqual(mockOrg);
			expect(getOrganizationByIdMock).toHaveBeenCalledWith("org-123");
		});

		it("throws NOT_FOUND when organization does not exist", async () => {
			getOrganizationByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ id: "non-existent" })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user is not admin", async () => {
			const client = createClient("member");

			await expect(client({ id: "org-123" })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				adminRouter.organizations.find,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(client({ id: "org-123" })).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
