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
			"EXPORT",
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

describe("auditLogsRouter.list", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns logs and total", async () => {
		const mockLogs = [{ id: "log-1", action: "CREATE", resource: "users" }];
		getAuditLogsMock.mockResolvedValue(mockLogs);
		countAuditLogsMock.mockResolvedValue(1);

		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result.logs).toEqual(mockLogs);
		expect(result.total).toBe(1);
	});

	it("passes filters to query", async () => {
		getAuditLogsMock.mockResolvedValue([]);
		countAuditLogsMock.mockResolvedValue(0);

		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		await client({ limit: 10, offset: 5, resource: "payments" });

		expect(getAuditLogsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 10,
				offset: 5,
				resource: "payments",
			}),
		);
	});
});

describe("auditLogsRouter.filters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns actions and resources", async () => {
		getDistinctResourcesMock.mockResolvedValue([
			"users",
			"payments",
			"files",
		]);

		const client = createProcedureClient(auditLogsRouter.filters, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result.actions).toEqual([
			"CREATE",
			"READ",
			"UPDATE",
			"DELETE",
			"LOGIN",
			"LOGOUT",
			"EXPORT",
		]);
		expect(result.resources).toEqual(["users", "payments", "files"]);
	});
});

describe("auditLogsRouter.export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
		createAuditLogMock.mockResolvedValue(undefined);
	});

	it("returns JSON format by default", async () => {
		const mockLogs = [
			{
				id: "log-1",
				action: "CREATE",
				resource: "users",
				createdAt: new Date("2025-01-01T00:00:00Z"),
				userId: "user-1",
				organizationId: "org-1",
				resourceId: null,
				ipAddress: "127.0.0.1",
				userAgent: "test",
				sessionId: "sess-1",
				success: true,
				metadata: {},
			},
		];
		getAuditLogsForExportMock.mockResolvedValue(mockLogs);

		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "json" });

		expect(result.format).toBe("json");
		expect(result.data).toEqual(mockLogs);
		expect(result.filename).toMatch(/^audit-logs-.*\.json$/);
	});

	it("returns CSV format when requested", async () => {
		const mockLogs = [
			{
				id: "log-1",
				action: "CREATE",
				resource: "users",
				createdAt: new Date("2025-01-01T00:00:00Z"),
				userId: "user-1",
				organizationId: "org-1",
				resourceId: null,
				ipAddress: "127.0.0.1",
				userAgent: "test-agent",
				sessionId: "sess-1",
				success: true,
				metadata: { key: "value" },
			},
		];
		getAuditLogsForExportMock.mockResolvedValue(mockLogs);

		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "csv" });

		expect(result.format).toBe("csv");
		expect(typeof result.data).toBe("string");
		expect(result.data).toContain("id,createdAt");
		expect(result.data).toContain("log-1");
		expect(result.filename).toMatch(/^audit-logs-.*\.csv$/);
	});

	it("logs the export action for audit trail", async () => {
		getAuditLogsForExportMock.mockResolvedValue([]);

		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		await client({ format: "json" });

		expect(createAuditLogMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: ADMIN_USER.id,
				action: "EXPORT",
				resource: "audit_logs",
			}),
		);
	});
});
