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
		AuditActionSchema: z.enum(["CREATE", "UPDATE", "DELETE", "EXPORT"]),
	},
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const ADMIN_USER = {
	id: "admin-user-id",
	email: "admin@example.com",
	role: "admin",
};

const mockAdminSession = {
	session: {
		id: "session-1",
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
		const logs = [{ id: "log-1", action: "CREATE" }];
		getAuditLogsMock.mockResolvedValue(logs);
		countAuditLogsMock.mockResolvedValue(1);

		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result).toEqual({ logs, total: 1 });
	});

	it("throws UNAUTHORIZED when not authenticated", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(auditLogsRouter.list, {
			context: authenticatedContext,
		});

		await expect(client({})).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});

describe("auditLogsRouter.filters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
	});

	it("returns actions and resources", async () => {
		getDistinctResourcesMock.mockResolvedValue(["invoices", "audit_logs"]);

		const client = createProcedureClient(auditLogsRouter.filters, {
			context: authenticatedContext,
		});
		const result = await client({});

		expect(result.actions).toEqual([
			"CREATE",
			"UPDATE",
			"DELETE",
			"EXPORT",
		]);
		expect(result.resources).toEqual(["invoices", "audit_logs"]);
	});
});

describe("auditLogsRouter.export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockAdminSession);
		createAuditLogMock.mockResolvedValue(undefined);
	});

	it("exports logs as JSON by default", async () => {
		const logs = [{ id: "log-1", action: "CREATE" }];
		getAuditLogsForExportMock.mockResolvedValue(logs);

		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "json" });

		expect(result.format).toBe("json");
		expect(result.data).toEqual(logs);
		expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.json$/);
		expect(createAuditLogMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: ADMIN_USER.id,
				action: "EXPORT",
				resource: "audit_logs",
				metadata: expect.objectContaining({
					format: "json",
					recordCount: 1,
				}),
			}),
		);
	});

	it("exports logs as CSV", async () => {
		const logs = [
			{
				id: "log-1",
				createdAt: new Date("2026-01-01T00:00:00Z"),
				userId: "user-1",
				organizationId: "org-1",
				action: "CREATE",
				resource: "invoices",
				resourceId: "inv-1",
				ipAddress: "127.0.0.1",
				userAgent: "Mozilla/5.0",
				sessionId: "sess-1",
				success: true,
				metadata: { key: "value" },
			},
		];
		getAuditLogsForExportMock.mockResolvedValue(logs);

		const client = createProcedureClient(auditLogsRouter.export, {
			context: authenticatedContext,
		});
		const result = await client({ format: "csv" });

		expect(result.format).toBe("csv");
		expect(typeof result.data).toBe("string");
		expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.csv$/);
		// CSV should include header row
		expect(result.data).toContain("id,createdAt,userId");
		// and the log data
		expect(result.data).toContain("log-1");
	});
});
