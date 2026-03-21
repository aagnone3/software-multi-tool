import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { auditLogsRouter } from "./router";

const getSessionMock = vi.hoisted(() => vi.fn());
const getAuditLogsMock = vi.hoisted(() => vi.fn());
const countAuditLogsMock = vi.hoisted(() => vi.fn());
const getDistinctResourcesMock = vi.hoisted(() => vi.fn());
const getAuditLogsForExportMock = vi.hoisted(() => vi.fn());
const createAuditLogMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getAuditLogs: getAuditLogsMock,
	countAuditLogs: countAuditLogsMock,
	getDistinctResources: getDistinctResourcesMock,
	getAuditLogsForExport: getAuditLogsForExportMock,
	createAuditLog: createAuditLogMock,
	zodSchemas: {
		AuditActionSchema: z.enum([
			"CREATE",
			"READ",
			"UPDATE",
			"DELETE",
			"LOGIN",
			"LOGOUT",
			"PASSWORD_CHANGE",
			"MFA_SETUP",
			"MFA_DISABLE",
			"IMPERSONATE",
			"INVITE",
			"EXPORT",
			"SUBSCRIPTION_CHANGE",
			"PAYMENT",
		]),
	},
}));

const ADMIN_USER = {
	id: "admin-user-id",
	email: "admin@example.com",
	role: "admin",
};

const mockAdminSession = {
	session: {
		id: "session-id",
		activeOrganizationId: "org-1",
		ipAddress: "127.0.0.1",
		userAgent: "test-agent",
	},
	user: ADMIN_USER,
};

const authenticatedContext = { headers: new Headers() };

const sampleLog = {
	id: "log-1",
	createdAt: new Date("2026-01-01T00:00:00Z"),
	userId: "user-1",
	organizationId: "org-1",
	action: "CREATE",
	resource: "users",
	resourceId: "res-1",
	ipAddress: "127.0.0.1",
	userAgent: "Mozilla/5.0",
	sessionId: "session-1",
	success: true,
	metadata: { foo: "bar" },
};

describe("auditLogsRouter.list", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
		getAuditLogsMock.mockResolvedValue([sampleLog]);
		countAuditLogsMock.mockResolvedValue(1);
	});

	it("lists audit logs with default pagination", async () => {
		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		const result = await client({ limit: 25, offset: 0 });
		expect(result.logs).toEqual([sampleLog]);
		expect(result.total).toBe(1);
		expect(getAuditLogsMock).toHaveBeenCalledWith(
			expect.objectContaining({ limit: 25, offset: 0 }),
		);
	});

	it("applies filters to audit log query", async () => {
		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		await client({
			limit: 10,
			offset: 5,
			userId: "user-1",
			resource: "users",
		});
		expect(getAuditLogsMock).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1", resource: "users" }),
		);
	});

	it("throws UNAUTHORIZED when not authenticated", async () => {
		getSessionMock.mockResolvedValue(null);
		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		await expect(client({})).rejects.toThrow();
	});
});

describe("auditLogsRouter.filters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
		getDistinctResourcesMock.mockResolvedValue(["users", "organizations"]);
	});

	it("returns available filter options", async () => {
		const client = createProcedureClient(auditLogsRouter.filters, {
			context: authenticatedContext,
		});
		const result = await client({});
		expect(result.resources).toEqual(["users", "organizations"]);
		expect(result.actions).toContain("CREATE");
		expect(result.actions).toContain("EXPORT");
	});

	it("throws UNAUTHORIZED when not authenticated", async () => {
		getSessionMock.mockResolvedValue(null);
		const client = createProcedureClient(auditLogsRouter.filters, {
			context: authenticatedContext,
		});
		await expect(client({})).rejects.toThrow();
	});
});

describe("auditLogsRouter.export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
		getAuditLogsForExportMock.mockResolvedValue([sampleLog]);
		createAuditLogMock.mockResolvedValue(undefined);
	});

	it("exports audit logs as JSON by default", async () => {
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({});
		expect(result.format).toBe("json");
		expect(result.data).toEqual([sampleLog]);
		expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.json$/);
	});

	it("exports audit logs as CSV when format=csv", async () => {
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "csv" });
		expect(result.format).toBe("csv");
		expect(typeof result.data).toBe("string");
		expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.csv$/);
	});

	it("CSV output includes header row and log data", async () => {
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "csv" });
		const lines = (result.data as string).split("\n");
		expect(lines[0]).toContain("id");
		expect(lines[0]).toContain("action");
		expect(lines[1]).toContain("log-1");
		expect(lines[1]).toContain("CREATE");
	});

	it("CSV escapes user agent containing commas", async () => {
		const logWithComma = {
			...sampleLog,
			userAgent: "Mozilla/5.0 (Windows NT 10.0, Win64)",
		};
		getAuditLogsForExportMock.mockResolvedValue([logWithComma]);
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "csv" });
		expect(result.data as string).toContain(
			'"Mozilla/5.0 (Windows NT 10.0, Win64)"',
		);
	});

	it("creates an audit log entry for the export action", async () => {
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		await client({});
		expect(createAuditLogMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: ADMIN_USER.id,
				action: "EXPORT",
				resource: "audit_logs",
			}),
		);
	});

	it("throws UNAUTHORIZED when not authenticated", async () => {
		getSessionMock.mockResolvedValue(null);
		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		await expect(client({})).rejects.toThrow();
	});
});
