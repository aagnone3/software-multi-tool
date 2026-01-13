import type { ToolJob } from "@repo/database/prisma/generated/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GdprExporterInput } from "../types";

// Mock dependencies
vi.mock("@repo/database", () => ({
	db: {
		user: { findUnique: vi.fn() },
		toolJob: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		auditLog: { create: vi.fn() },
	},
	collectAllUserDataForExport: vi.fn(),
	createAuditLog: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@repo/mail", () => ({
	sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@repo/storage", () => ({
	createStorageProvider: vi.fn(() => ({
		upload: vi
			.fn()
			.mockResolvedValue({ key: "test-key", bucket: "uploads" }),
		getSignedDownloadUrl: vi
			.fn()
			.mockResolvedValue("https://example.com/download"),
	})),
}));

describe("processGdprExportJob", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockJob = (input: GdprExporterInput): ToolJob => ({
		id: "job-123",
		toolSlug: "gdpr-exporter",
		status: "PROCESSING",
		priority: 0,
		input: input as unknown as Record<string, unknown>,
		output: null,
		error: null,
		userId: input.userId,
		sessionId: null,
		pgBossJobId: null,
		attempts: 1,
		maxAttempts: 3,
		startedAt: new Date(),
		completedAt: null,
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const mockUserData = {
		profile: {
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
		},
		accounts: [
			{
				id: "account-1",
				providerId: "google",
				accountId: "google-123",
				scope: "email profile",
				createdAt: new Date("2025-01-01"),
				updatedAt: new Date("2025-01-01"),
			},
		],
		sessions: [
			{
				id: "session-1",
				ipAddress: "127.0.0.1",
				userAgent: "Mozilla/5.0",
				createdAt: new Date("2025-01-15"),
				expiresAt: new Date("2025-02-15"),
			},
		],
		organizations: [
			{
				role: "owner",
				createdAt: new Date("2025-01-01"),
				organization: {
					id: "org-1",
					name: "Test Org",
					slug: "test-org",
				},
			},
		],
		purchases: [],
		aiChats: [
			{
				id: "chat-1",
				title: "Test Chat",
				messageCount: 5,
				organizationId: null,
				createdAt: new Date("2025-01-10"),
				updatedAt: new Date("2025-01-10"),
			},
		],
		toolJobs: [
			{
				id: "tool-job-1",
				toolSlug: "news-analyzer",
				status: "COMPLETED",
				createdAt: new Date("2025-01-12"),
				completedAt: new Date("2025-01-12"),
			},
		],
		auditLogs: [
			{
				id: "audit-1",
				action: "LOGIN",
				resource: "session",
				resourceId: "session-1",
				success: true,
				ipAddress: "127.0.0.1",
				createdAt: new Date("2025-01-15"),
			},
		],
	};

	it("should successfully process a GDPR export job", async () => {
		const { collectAllUserDataForExport, createAuditLog } = vi.mocked(
			await import("@repo/database"),
		);
		const { sendEmail } = vi.mocked(await import("@repo/mail"));

		collectAllUserDataForExport.mockResolvedValue(mockUserData);
		createAuditLog.mockResolvedValue({} as never);

		const { processGdprExportJob } = await import("./processor");

		const job = createMockJob({
			userId: "user-123",
			userEmail: "test@example.com",
			format: "json",
			requestedAt: new Date().toISOString(),
		});

		const result = await processGdprExportJob(job);

		expect(result.success).toBe(true);
		expect(result.output).toBeDefined();

		const output = result.output as {
			downloadUrl: string;
			expiresAt: string;
			format: string;
			categories: string[];
			totalRecords: number;
			generatedAt: string;
		};

		expect(output.downloadUrl).toBe("https://example.com/download");
		expect(output.format).toBe("json");
		expect(output.categories).toContain("profile");
		expect(output.categories).toContain("accounts");
		expect(output.categories).toContain("sessions");
		expect(output.totalRecords).toBeGreaterThan(0);

		// Verify data collection was called
		expect(collectAllUserDataForExport).toHaveBeenCalledWith("user-123");

		// Verify audit log was created
		expect(createAuditLog).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-123",
				action: "EXPORT",
				resource: "user-data",
				success: true,
			}),
		);

		// Verify email was sent
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "test@example.com",
				subject: "Your data export is ready",
			}),
		);
	});

	it("should return error when user not found", async () => {
		const { collectAllUserDataForExport } = vi.mocked(
			await import("@repo/database"),
		);

		collectAllUserDataForExport.mockResolvedValue({
			profile: null,
			accounts: [],
			sessions: [],
			organizations: [],
			purchases: [],
			aiChats: [],
			toolJobs: [],
			auditLogs: [],
		});

		const { processGdprExportJob } = await import("./processor");

		const job = createMockJob({
			userId: "nonexistent-user",
			userEmail: "test@example.com",
			format: "json",
			requestedAt: new Date().toISOString(),
		});

		const result = await processGdprExportJob(job);

		expect(result.success).toBe(false);
		expect(result.error).toBe("User not found");
	});

	it("should handle storage upload errors gracefully", async () => {
		const { collectAllUserDataForExport } = vi.mocked(
			await import("@repo/database"),
		);
		collectAllUserDataForExport.mockResolvedValue(mockUserData);

		// Mock storage to throw error
		vi.doMock("@repo/storage", () => ({
			createStorageProvider: vi.fn(() => ({
				upload: vi
					.fn()
					.mockRejectedValue(new Error("Storage unavailable")),
				getSignedDownloadUrl: vi.fn(),
			})),
		}));

		// Need to re-import to get new mocks
		vi.resetModules();
		const { processGdprExportJob } = await import("./processor");

		const job = createMockJob({
			userId: "user-123",
			userEmail: "test@example.com",
			format: "json",
			requestedAt: new Date().toISOString(),
		});

		const result = await processGdprExportJob(job);

		expect(result.success).toBe(false);
		expect(result.error).toContain("Storage unavailable");
	});
});
