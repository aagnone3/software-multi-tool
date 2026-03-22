import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminRouter } from "./router";

const getSessionMock = vi.hoisted(() => vi.fn());
const getOrganizationsMock = vi.hoisted(() => vi.fn());
const countAllOrganizationsMock = vi.hoisted(() => vi.fn());
const getOrganizationByIdMock = vi.hoisted(() => vi.fn());
const getUsersMock = vi.hoisted(() => vi.fn());
const countAllUsersMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getOrganizations: getOrganizationsMock,
	countAllOrganizations: countAllOrganizationsMock,
	getOrganizationById: getOrganizationByIdMock,
	getUsers: getUsersMock,
	countAllUsers: countAllUsersMock,
	zodSchemas: { AuditActionSchema: { optional: () => ({}) } },
	getAuditLogsForExport: vi.fn(),
	createAuditLog: vi.fn(),
}));

vi.mock("@repo/logs", () => ({ logger: loggerMock }));

const ADMIN_USER = {
	id: "admin-user-id",
	email: "admin@example.com",
	role: "admin",
};

const mockAdminSession = {
	session: { activeOrganizationId: "org-1" },
	user: ADMIN_USER,
};

const authenticatedContext = { headers: new Headers() };

describe("adminRouter.organizations.list", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns organizations and total", async () => {
		const orgs = [{ id: "org-1", name: "Acme" }];
		getOrganizationsMock.mockResolvedValue(orgs);
		countAllOrganizationsMock.mockResolvedValue(1);

		const client = createProcedureClient(adminRouter.organizations.list, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result.organizations).toEqual(orgs);
		expect(result.total).toBe(1);
		expect(getOrganizationsMock).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
			query: undefined,
		});
	});

	it("passes query, limit, offset to db", async () => {
		getOrganizationsMock.mockResolvedValue([]);
		countAllOrganizationsMock.mockResolvedValue(0);

		const client = createProcedureClient(adminRouter.organizations.list, {
			context: authenticatedContext,
		});
		await client({ query: "test", limit: 5, offset: 10 });

		expect(getOrganizationsMock).toHaveBeenCalledWith({
			limit: 5,
			offset: 10,
			query: "test",
		});
	});

	it("throws UNAUTHORIZED when no session", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(adminRouter.organizations.list, {
			context: authenticatedContext,
		});
		await expect(client({})).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});

describe("adminRouter.organizations.find", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns organization when found", async () => {
		const org = { id: "org-1", name: "Acme" };
		getOrganizationByIdMock.mockResolvedValue(org);

		const client = createProcedureClient(adminRouter.organizations.find, {
			context: authenticatedContext,
		});
		const result = await client({ id: "org-1" });

		expect(result).toEqual(org);
	});

	it("throws NOT_FOUND when organization does not exist", async () => {
		getOrganizationByIdMock.mockResolvedValue(null);

		const client = createProcedureClient(adminRouter.organizations.find, {
			context: authenticatedContext,
		});
		await expect(client({ id: "missing" })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("throws UNAUTHORIZED when no session", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(adminRouter.organizations.find, {
			context: authenticatedContext,
		});
		await expect(client({ id: "org-1" })).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});

describe("adminRouter.users.list", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns users and total", async () => {
		const users = [{ id: "user-1", email: "user@example.com" }];
		getUsersMock.mockResolvedValue(users);
		countAllUsersMock.mockResolvedValue(1);

		const client = createProcedureClient(adminRouter.users.list, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result.users).toEqual(users);
		expect(result.total).toBe(1);
		expect(getUsersMock).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
			query: undefined,
		});
	});

	it("passes query, limit, offset to db", async () => {
		getUsersMock.mockResolvedValue([]);
		countAllUsersMock.mockResolvedValue(0);

		const client = createProcedureClient(adminRouter.users.list, {
			context: authenticatedContext,
		});
		await client({ query: "alice", limit: 25, offset: 50 });

		expect(getUsersMock).toHaveBeenCalledWith({
			limit: 25,
			offset: 50,
			query: "alice",
		});
	});

	it("throws UNAUTHORIZED when no session", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(adminRouter.users.list, {
			context: authenticatedContext,
		});
		await expect(client({})).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});
