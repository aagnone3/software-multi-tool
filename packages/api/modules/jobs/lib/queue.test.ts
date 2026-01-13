import { beforeEach, describe, expect, it, vi } from "vitest";
import { arePgBossWorkersActive, submitJobToQueue } from "./queue";

// Mock @repo/database
vi.mock("@repo/database", () => ({
	db: {
		$queryRaw: vi.fn(),
		$executeRaw: vi.fn(),
		toolJob: {
			update: vi.fn(),
		},
	},
}));

// Mock @repo/logs
vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { db } from "@repo/database";
import { logger } from "@repo/logs";

describe("queue", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("submitJobToQueue", () => {
		it("should submit job to pg-boss queue and update ToolJob", async () => {
			const pgBossJobId = "550e8400-e29b-41d4-a716-446655440000";

			// Mock ensureQueueExists (via $executeRaw)
			vi.mocked(db.$executeRaw).mockResolvedValue(1);

			// Mock INSERT into pgboss.job
			vi.mocked(db.$queryRaw).mockResolvedValue([{ id: pgBossJobId }]);

			// Mock ToolJob update
			vi.mocked(db.toolJob.update).mockResolvedValue({} as never);

			const result = await submitJobToQueue("news-analyzer", "job-123", {
				priority: 5,
			});

			expect(result).toBe(pgBossJobId);

			// Verify queue creation was attempted
			expect(db.$executeRaw).toHaveBeenCalled();

			// Verify job was inserted
			expect(db.$queryRaw).toHaveBeenCalled();

			// Verify ToolJob was updated with pgBossJobId
			expect(db.toolJob.update).toHaveBeenCalledWith({
				where: { id: "job-123" },
				data: { pgBossJobId },
			});

			// Verify logging
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("Job submitted"),
			);
		});

		it("should return null when job insertion fails", async () => {
			// Mock ensureQueueExists
			vi.mocked(db.$executeRaw).mockResolvedValue(1);

			// Mock INSERT failure - returns empty array
			vi.mocked(db.$queryRaw).mockResolvedValue([]);

			const result = await submitJobToQueue("news-analyzer", "job-456");

			expect(result).toBeNull();

			// ToolJob should NOT be updated
			expect(db.toolJob.update).not.toHaveBeenCalled();

			// Should log warning
			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("Failed to submit job"),
			);
		});

		it("should handle database errors gracefully", async () => {
			// Mock ensureQueueExists
			vi.mocked(db.$executeRaw).mockResolvedValue(1);

			// Mock INSERT throwing an error
			vi.mocked(db.$queryRaw).mockRejectedValue(
				new Error("Database connection error"),
			);

			const result = await submitJobToQueue("news-analyzer", "job-789");

			expect(result).toBeNull();

			// Should log error
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Error submitting job"),
				expect.objectContaining({
					error: "Database connection error",
				}),
			);
		});

		it("should use default priority when not specified", async () => {
			const pgBossJobId = "550e8400-e29b-41d4-a716-446655440001";

			vi.mocked(db.$executeRaw).mockResolvedValue(1);
			vi.mocked(db.$queryRaw).mockResolvedValue([{ id: pgBossJobId }]);
			vi.mocked(db.toolJob.update).mockResolvedValue({} as never);

			await submitJobToQueue("news-analyzer", "job-default");

			// Verify priority 0 is used by default (can't directly check SQL params,
			// but we can verify the call was made)
			expect(db.$queryRaw).toHaveBeenCalled();
		});

		it("should handle startAfter option", async () => {
			const pgBossJobId = "550e8400-e29b-41d4-a716-446655440002";
			const startAfter = new Date("2026-01-15T10:00:00Z");

			vi.mocked(db.$executeRaw).mockResolvedValue(1);
			vi.mocked(db.$queryRaw).mockResolvedValue([{ id: pgBossJobId }]);
			vi.mocked(db.toolJob.update).mockResolvedValue({} as never);

			const result = await submitJobToQueue(
				"news-analyzer",
				"job-delayed",
				{
					startAfter,
				},
			);

			expect(result).toBe(pgBossJobId);
			expect(db.$queryRaw).toHaveBeenCalled();
		});

		it("should handle singletonKey option for deduplication", async () => {
			const pgBossJobId = "550e8400-e29b-41d4-a716-446655440003";

			vi.mocked(db.$executeRaw).mockResolvedValue(1);
			vi.mocked(db.$queryRaw).mockResolvedValue([{ id: pgBossJobId }]);
			vi.mocked(db.toolJob.update).mockResolvedValue({} as never);

			const result = await submitJobToQueue(
				"news-analyzer",
				"job-singleton",
				{
					singletonKey: "unique-article-url-hash",
				},
			);

			expect(result).toBe(pgBossJobId);
			expect(db.$queryRaw).toHaveBeenCalled();
		});
	});

	describe("arePgBossWorkersActive", () => {
		it("should return true when recent jobs exist", async () => {
			vi.mocked(db.$queryRaw).mockResolvedValue([{ count: BigInt(5) }]);

			const result = await arePgBossWorkersActive();

			expect(result).toBe(true);
		});

		it("should return false when no recent jobs exist", async () => {
			vi.mocked(db.$queryRaw).mockResolvedValue([{ count: BigInt(0) }]);

			const result = await arePgBossWorkersActive();

			expect(result).toBe(false);
		});

		it("should return false on database error", async () => {
			vi.mocked(db.$queryRaw).mockRejectedValue(
				new Error("Database unavailable"),
			);

			const result = await arePgBossWorkersActive();

			expect(result).toBe(false);
		});

		it("should return false when query returns null", async () => {
			vi.mocked(db.$queryRaw).mockResolvedValue([]);

			const result = await arePgBossWorkersActive();

			expect(result).toBe(false);
		});
	});
});
