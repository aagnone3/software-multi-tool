import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogsRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getAuditLogsMock = vi.hoisted(() => vi.fn());
const countAuditLogsMock = vi.hoisted(() => vi.fn());
const getDistinctResourcesMock = vi.hoisted(() => vi.fn());
const getAuditLogsForExportMock = vi.hoisted(() => vi.fn());
const createAuditLogMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", async () => {
	const { z } = await import("zod");
	return {
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
	};
});

describe("Audit Logs Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("admin.auditLogs.list", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: { id: "session-1" },
			});

			return createProcedureClient(auditLogsRouter.list, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("lists audit logs with default pagination", async () => {
			const mockLogs = [
				{
					id: "log-1",
					action: "LOGIN",
					resource: "user",
					userId: "user-1",
					createdAt: new Date(),
					success: true,
				},
				{
					id: "log-2",
					action: "CREATE",
					resource: "organization",
					userId: "user-2",
					createdAt: new Date(),
					success: true,
				},
			];
			getAuditLogsMock.mockResolvedValue(mockLogs);
			countAuditLogsMock.mockResolvedValue(100);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ logs: mockLogs, total: 100 });
			expect(getAuditLogsMock).toHaveBeenCalledWith({
				limit: 25,
				offset: 0,
			});
		});

		it("lists audit logs with custom pagination", async () => {
			getAuditLogsMock.mockResolvedValue([]);
			countAuditLogsMock.mockResolvedValue(200);

			const client = createClient();
			const result = await client({ limit: 50, offset: 100 });

			expect(result).toEqual({ logs: [], total: 200 });
			expect(getAuditLogsMock).toHaveBeenCalledWith({
				limit: 50,
				offset: 100,
			});
		});

		it("lists audit logs with filters", async () => {
			const mockLogs = [
				{
					id: "log-1",
					action: "LOGIN",
					resource: "user",
					userId: "user-1",
					createdAt: new Date(),
					success: true,
				},
			];
			getAuditLogsMock.mockResolvedValue(mockLogs);
			countAuditLogsMock.mockResolvedValue(10);

			const client = createClient();
			const result = await client({
				action: "LOGIN",
				resource: "user",
				success: true,
			});

			expect(result).toEqual({ logs: mockLogs, total: 10 });
			expect(getAuditLogsMock).toHaveBeenCalledWith({
				limit: 25,
				offset: 0,
				action: "LOGIN",
				resource: "user",
				success: true,
			});
		});

		it("lists audit logs with search", async () => {
			getAuditLogsMock.mockResolvedValue([]);
			countAuditLogsMock.mockResolvedValue(0);

			const client = createClient();
			const result = await client({ search: "user-123" });

			expect(result).toEqual({ logs: [], total: 0 });
			expect(getAuditLogsMock).toHaveBeenCalledWith({
				limit: 25,
				offset: 0,
				search: "user-123",
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

			const client = createProcedureClient(auditLogsRouter.list, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("admin.auditLogs.filters", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: { id: "session-1" },
			});

			return createProcedureClient(auditLogsRouter.filters, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("returns available filter options", async () => {
			getDistinctResourcesMock.mockResolvedValue([
				"user",
				"organization",
				"subscription",
			]);

			const client = createClient();
			const result = await client({});

			expect(result).toHaveProperty("actions");
			expect(result).toHaveProperty("resources");
			expect(result.resources).toEqual([
				"user",
				"organization",
				"subscription",
			]);
			expect(result.actions).toContain("CREATE");
			expect(result.actions).toContain("LOGIN");
		});

		it("throws FORBIDDEN when user is not admin", async () => {
			const client = createClient("member");

			await expect(client({})).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});

	describe("admin.auditLogs.export", () => {
		const createClient = (role = "admin") => {
			getSessionMock.mockResolvedValue({
				user: { id: "admin-123", role },
				session: {
					id: "session-1",
					activeOrganizationId: "org-123",
					ipAddress: "127.0.0.1",
					userAgent: "Test/1.0",
				},
			});

			return createProcedureClient(auditLogsRouter.export, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("exports audit logs as JSON", async () => {
			const mockLogs = [
				{
					id: "log-1",
					action: "LOGIN",
					resource: "user",
					userId: "user-1",
					createdAt: new Date("2024-01-01"),
					success: true,
					organizationId: null,
					resourceId: null,
					ipAddress: "127.0.0.1",
					userAgent: "Mozilla/5.0",
					sessionId: "session-1",
					metadata: {},
				},
			];
			getAuditLogsForExportMock.mockResolvedValue(mockLogs);

			const client = createClient();
			const result = await client({ format: "json" });

			expect(result.format).toBe("json");
			expect(result.data).toEqual(mockLogs);
			expect(result.filename).toContain(".json");
		});

		it("exports audit logs as CSV", async () => {
			const mockLogs = [
				{
					id: "log-1",
					action: "LOGIN",
					resource: "user",
					userId: "user-1",
					createdAt: new Date("2024-01-01T00:00:00.000Z"),
					success: true,
					organizationId: null,
					resourceId: null,
					ipAddress: "127.0.0.1",
					userAgent: "Mozilla/5.0",
					sessionId: "session-1",
					metadata: { foo: "bar" },
				},
			];
			getAuditLogsForExportMock.mockResolvedValue(mockLogs);

			const client = createClient();
			const result = await client({ format: "csv" });

			expect(result.format).toBe("csv");
			expect(typeof result.data).toBe("string");
			expect(result.filename).toContain(".csv");
			// Check CSV contains headers and data
			expect(result.data as string).toContain("id,createdAt");
			expect(result.data as string).toContain("log-1");
		});

		it("exports with filters applied", async () => {
			getAuditLogsForExportMock.mockResolvedValue([]);

			const client = createClient();
			await client({
				format: "json",
				action: "LOGIN",
				resource: "user",
			});

			expect(getAuditLogsForExportMock).toHaveBeenCalledWith({
				action: "LOGIN",
				resource: "user",
			});
		});

		it("creates an audit log entry for the export action", async () => {
			const mockLogs = [
				{ id: "log-1", action: "LOGIN", resource: "user" },
			];
			getAuditLogsForExportMock.mockResolvedValue(mockLogs);

			const client = createClient();
			await client({ format: "json" });

			expect(createAuditLogMock).toHaveBeenCalledWith({
				userId: "admin-123",
				organizationId: "org-123",
				action: "EXPORT",
				resource: "audit_logs",
				sessionId: "session-1",
				ipAddress: "127.0.0.1",
				userAgent: "Test/1.0",
				metadata: {
					format: "json",
					filters: {},
					recordCount: 1,
				},
			});
		});

		it("throws FORBIDDEN when user is not admin", async () => {
			const client = createClient("member");

			await expect(client({ format: "json" })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(auditLogsRouter.export, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({ format: "json" })).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
