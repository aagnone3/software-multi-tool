import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../client";
import {
	collectAllUserDataForExport,
	getActiveGdprExportJob,
	getRecentGdprExportJobs,
	getUserAccountsForExport,
	getUserAiChatsForExport,
	getUserProfileForExport,
	getUserSessionsForExport,
} from "./gdpr-export";

// Mock the database client
vi.mock("../client", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
		},
		account: {
			findMany: vi.fn(),
		},
		session: {
			findMany: vi.fn(),
		},
		member: {
			findMany: vi.fn(),
		},
		purchase: {
			findMany: vi.fn(),
		},
		aiChat: {
			findMany: vi.fn(),
		},
		toolJob: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		auditLog: {
			findMany: vi.fn(),
		},
	},
}));

const mockedDb = vi.mocked(db);

describe("GDPR Export Queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUserProfileForExport", () => {
		it("should return user profile with correct fields", async () => {
			const mockProfile = {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				image: null,
				username: "testuser",
				role: "user",
				locale: "en",
				twoFactorEnabled: false,
				onboardingComplete: true,
				createdAt: new Date("2025-01-01"),
				updatedAt: new Date("2025-01-15"),
			};

			mockedDb.user.findUnique.mockResolvedValue(mockProfile);

			const result = await getUserProfileForExport("user-123");

			expect(result).toEqual(mockProfile);
			expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
				where: { id: "user-123" },
				select: expect.objectContaining({
					id: true,
					name: true,
					email: true,
					emailVerified: true,
				}),
			});
		});

		it("should return null for non-existent user", async () => {
			mockedDb.user.findUnique.mockResolvedValue(null);

			const result = await getUserProfileForExport("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("getUserAccountsForExport", () => {
		it("should return accounts without sensitive tokens", async () => {
			const mockAccounts = [
				{
					id: "account-1",
					providerId: "google",
					accountId: "google-123",
					scope: "email profile",
					createdAt: new Date("2025-01-01"),
					updatedAt: new Date("2025-01-01"),
				},
			];

			mockedDb.account.findMany.mockResolvedValue(mockAccounts);

			const result = await getUserAccountsForExport("user-123");

			expect(result).toEqual(mockAccounts);
			// Verify we're selecting only expected fields
			expect(mockedDb.account.findMany).toHaveBeenCalledWith({
				where: { userId: "user-123" },
				select: expect.objectContaining({
					id: true,
					providerId: true,
					accountId: true,
					scope: true,
				}),
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("getUserSessionsForExport", () => {
		it("should return sessions without token", async () => {
			const mockSessions = [
				{
					id: "session-1",
					ipAddress: "127.0.0.1",
					userAgent: "Mozilla/5.0",
					createdAt: new Date("2025-01-15"),
					expiresAt: new Date("2025-02-15"),
				},
			];

			mockedDb.session.findMany.mockResolvedValue(mockSessions);

			const result = await getUserSessionsForExport("user-123");

			expect(result).toEqual(mockSessions);
			expect(mockedDb.session.findMany).toHaveBeenCalledWith({
				where: { userId: "user-123" },
				select: expect.objectContaining({
					id: true,
					ipAddress: true,
					userAgent: true,
				}),
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("getUserAiChatsForExport", () => {
		it("should return chat metadata with message count", async () => {
			const mockChats = [
				{
					id: "chat-1",
					title: "Test Chat",
					messages: [{}, {}, {}], // 3 messages
					organizationId: null,
					createdAt: new Date("2025-01-10"),
					updatedAt: new Date("2025-01-10"),
				},
			];

			mockedDb.aiChat.findMany.mockResolvedValue(mockChats);

			const result = await getUserAiChatsForExport("user-123");

			expect(result).toHaveLength(1);
			expect(result[0].messageCount).toBe(3);
			expect(result[0]).not.toHaveProperty("messages");
		});
	});

	describe("collectAllUserDataForExport", () => {
		it("should collect all user data in parallel", async () => {
			const mockProfile = {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				image: null,
				username: "testuser",
				role: "user",
				locale: "en",
				twoFactorEnabled: false,
				onboardingComplete: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockedDb.user.findUnique.mockResolvedValue(mockProfile);
			mockedDb.account.findMany.mockResolvedValue([]);
			mockedDb.session.findMany.mockResolvedValue([]);
			mockedDb.member.findMany.mockResolvedValue([]);
			mockedDb.purchase.findMany.mockResolvedValue([]);
			mockedDb.aiChat.findMany.mockResolvedValue([]);
			mockedDb.toolJob.findMany.mockResolvedValue([]);
			mockedDb.auditLog.findMany.mockResolvedValue([]);

			const result = await collectAllUserDataForExport("user-123");

			expect(result.profile).toEqual(mockProfile);
			expect(result.accounts).toEqual([]);
			expect(result.sessions).toEqual([]);
			expect(result.organizations).toEqual([]);
			expect(result.purchases).toEqual([]);
			expect(result.aiChats).toEqual([]);
			expect(result.toolJobs).toEqual([]);
			expect(result.auditLogs).toEqual([]);
		});
	});

	describe("getRecentGdprExportJobs", () => {
		it("should return jobs created within specified hours", async () => {
			const recentJob = {
				id: "job-1",
				toolSlug: "gdpr-exporter",
				status: "COMPLETED",
				createdAt: new Date(),
			};

			mockedDb.toolJob.findMany.mockResolvedValue([recentJob]);

			const result = await getRecentGdprExportJobs("user-123", 24);

			expect(result).toHaveLength(1);
			expect(mockedDb.toolJob.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						userId: "user-123",
						toolSlug: "gdpr-exporter",
					}),
				}),
			);
		});
	});

	describe("getActiveGdprExportJob", () => {
		it("should find pending or processing export jobs", async () => {
			const activeJob = {
				id: "job-1",
				toolSlug: "gdpr-exporter",
				status: "PROCESSING",
				createdAt: new Date(),
			};

			mockedDb.toolJob.findFirst.mockResolvedValue(activeJob);

			const result = await getActiveGdprExportJob("user-123");

			expect(result).toEqual(activeJob);
			expect(mockedDb.toolJob.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						userId: "user-123",
						toolSlug: "gdpr-exporter",
						status: {
							in: ["PENDING", "PROCESSING"],
						},
					}),
				}),
			);
		});

		it("should return null when no active job exists", async () => {
			mockedDb.toolJob.findFirst.mockResolvedValue(null);

			const result = await getActiveGdprExportJob("user-123");

			expect(result).toBeNull();
		});
	});
});
