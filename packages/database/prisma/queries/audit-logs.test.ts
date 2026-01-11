import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auditLogCreate: vi.fn(),
	auditLogFindMany: vi.fn(),
	auditLogFindUnique: vi.fn(),
	auditLogCount: vi.fn(),
	auditLogDeleteMany: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		auditLog: {
			create: mocks.auditLogCreate,
			findMany: mocks.auditLogFindMany,
			findUnique: mocks.auditLogFindUnique,
			count: mocks.auditLogCount,
			deleteMany: mocks.auditLogDeleteMany,
		},
	},
}));

import {
	countAuditLogs,
	createAuditLog,
	deleteExpiredAuditLogs,
	getAuditLogById,
	getAuditLogs,
	getAuditLogsForExport,
	getDistinctResources,
} from "./audit-logs";

describe("audit-logs queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("createAuditLog", () => {
		it("creates an audit log with all fields", async () => {
			const mockLog = {
				id: "log-1",
				userId: "user-1",
				organizationId: "org-1",
				action: "LOGIN",
				resource: "user",
				resourceId: "user-1",
				ipAddress: "127.0.0.1",
				userAgent: "Mozilla/5.0",
				sessionId: "session-1",
				success: true,
				metadata: { browser: "Chrome" },
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
			};
			mocks.auditLogCreate.mockResolvedValueOnce(mockLog);

			const result = await createAuditLog({
				userId: "user-1",
				organizationId: "org-1",
				action: "LOGIN",
				resource: "user",
				resourceId: "user-1",
				ipAddress: "127.0.0.1",
				userAgent: "Mozilla/5.0",
				sessionId: "session-1",
				success: true,
				metadata: { browser: "Chrome" },
			});

			expect(result).toEqual(mockLog);
			expect(mocks.auditLogCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					userId: "user-1",
					organizationId: "org-1",
					action: "LOGIN",
					resource: "user",
					resourceId: "user-1",
					ipAddress: "127.0.0.1",
					userAgent: "Mozilla/5.0",
					sessionId: "session-1",
					success: true,
					metadata: { browser: "Chrome" },
					expiresAt: expect.any(Date),
				}),
			});
		});

		it("creates an audit log with default success value", async () => {
			mocks.auditLogCreate.mockResolvedValueOnce({
				id: "log-1",
				success: true,
			});

			await createAuditLog({
				action: "CREATE",
				resource: "user",
			});

			expect(mocks.auditLogCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					success: true,
				}),
			});
		});

		it("uses custom retention period", async () => {
			mocks.auditLogCreate.mockResolvedValueOnce({
				id: "log-1",
			});

			const now = Date.now();
			vi.useFakeTimers();
			vi.setSystemTime(now);

			await createAuditLog({
				action: "DELETE",
				resource: "user",
				retentionDays: 30,
			});

			const expectedExpiry = new Date(now);
			expectedExpiry.setDate(expectedExpiry.getDate() + 30);

			expect(mocks.auditLogCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					expiresAt: expectedExpiry,
				}),
			});

			vi.useRealTimers();
		});
	});

	describe("getAuditLogs", () => {
		it("returns paginated audit logs", async () => {
			const mockLogs = [
				{ id: "log-1", action: "LOGIN" },
				{ id: "log-2", action: "LOGOUT" },
			];
			mocks.auditLogFindMany.mockResolvedValueOnce(mockLogs);

			const result = await getAuditLogs({ limit: 10, offset: 0 });

			expect(result).toEqual(mockLogs);
			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: {},
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by userId", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);

			await getAuditLogs({
				limit: 10,
				offset: 0,
				userId: "user-123",
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: { userId: "user-123" },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by action", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);

			await getAuditLogs({
				limit: 10,
				offset: 0,
				action: "LOGIN",
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: { action: "LOGIN" },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by date range", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-01-31");

			await getAuditLogs({
				limit: 10,
				offset: 0,
				startDate,
				endDate,
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: {
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
				},
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by search term", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);

			await getAuditLogs({
				limit: 10,
				offset: 0,
				search: "test",
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: {
					OR: [
						{ resource: { contains: "test", mode: "insensitive" } },
						{
							resourceId: {
								contains: "test",
								mode: "insensitive",
							},
						},
						{
							ipAddress: {
								contains: "test",
								mode: "insensitive",
							},
						},
					],
				},
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by success status", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);

			await getAuditLogs({
				limit: 10,
				offset: 0,
				success: false,
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: { success: false },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("countAuditLogs", () => {
		it("counts audit logs with filters", async () => {
			mocks.auditLogCount.mockResolvedValueOnce(42);

			const result = await countAuditLogs({
				action: "LOGIN",
				resource: "user",
			});

			expect(result).toBe(42);
			expect(mocks.auditLogCount).toHaveBeenCalledWith({
				where: {
					action: "LOGIN",
					resource: "user",
				},
			});
		});
	});

	describe("getAuditLogById", () => {
		it("returns audit log by id", async () => {
			const mockLog = { id: "log-1", action: "LOGIN" };
			mocks.auditLogFindUnique.mockResolvedValueOnce(mockLog);

			const result = await getAuditLogById("log-1");

			expect(result).toEqual(mockLog);
			expect(mocks.auditLogFindUnique).toHaveBeenCalledWith({
				where: { id: "log-1" },
			});
		});
	});

	describe("deleteExpiredAuditLogs", () => {
		it("deletes expired audit logs", async () => {
			mocks.auditLogDeleteMany.mockResolvedValueOnce({ count: 50 });

			const result = await deleteExpiredAuditLogs();

			expect(result).toBe(50);
			expect(mocks.auditLogDeleteMany).toHaveBeenCalledWith({
				where: {
					expiresAt: {
						lte: expect.any(Date),
					},
				},
			});
		});
	});

	describe("getDistinctResources", () => {
		it("returns distinct resource values", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([
				{ resource: "user" },
				{ resource: "organization" },
				{ resource: "subscription" },
			]);

			const result = await getDistinctResources();

			expect(result).toEqual(["user", "organization", "subscription"]);
			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				select: { resource: true },
				distinct: ["resource"],
				orderBy: { resource: "asc" },
			});
		});
	});

	describe("getAuditLogsForExport", () => {
		it("returns logs for export with limit", async () => {
			const mockLogs = [{ id: "log-1" }, { id: "log-2" }];
			mocks.auditLogFindMany.mockResolvedValueOnce(mockLogs);

			const result = await getAuditLogsForExport({});

			expect(result).toEqual(mockLogs);
			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: {},
				take: 10000,
				orderBy: { createdAt: "desc" },
			});
		});

		it("applies filters for export", async () => {
			mocks.auditLogFindMany.mockResolvedValueOnce([]);

			await getAuditLogsForExport({
				action: "DELETE",
				resource: "organization",
			});

			expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
				where: {
					action: "DELETE",
					resource: "organization",
				},
				take: 10000,
				orderBy: { createdAt: "desc" },
			});
		});
	});
});
