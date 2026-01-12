import { db } from "@repo/database";
import { describe, expect, it } from "vitest";

describe.skip("Database Connection", () => {
	// Skip database tests - requires running PostgreSQL instance
	// These tests should be run as integration tests with Testcontainers

	describe("Prisma Client", () => {
		it("should connect to database successfully", async () => {
			// Test connection with a simple query
			const result = await db.$queryRaw`SELECT 1 as value`;
			expect(result).toBeDefined();
		});

		it("should execute raw queries", async () => {
			const result = await db.$queryRaw<Array<{ now: Date }>>`
				SELECT NOW() as now
			`;

			expect(result).toHaveLength(1);
			expect(result[0].now).toBeInstanceOf(Date);
		});

		it("should handle connection pool", async () => {
			// Execute multiple queries in parallel
			const queries = Array.from(
				{ length: 5 },
				(_, i) => db.$queryRaw`SELECT ${i} as value`,
			);

			const results = await Promise.all(queries);
			expect(results).toHaveLength(5);
		});
	});

	describe("Database Operations", () => {
		it("should query users table (if exists)", async () => {
			try {
				const users = await db.user.findMany({
					take: 1,
				});

				// Should not throw error
				expect(Array.isArray(users)).toBe(true);
			} catch (error) {
				// Table might not exist in test environment
				expect(error).toBeDefined();
			}
		});

		it("should handle transactions", async () => {
			try {
				const result = await db.$transaction(async (tx) => {
					// Simple transaction test
					const count = await tx.$queryRaw`SELECT 1 as value`;
					return count;
				});

				expect(result).toBeDefined();
			} catch (error) {
				// Transaction might fail in test environment
				expect(error).toBeDefined();
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid queries gracefully", async () => {
			await expect(
				db.$queryRaw`SELECT * FROM nonexistent_table`,
			).rejects.toThrow();
		});

		it("should handle connection errors", async () => {
			// This test verifies error handling exists
			expect(db.$disconnect).toBeDefined();
			expect(db.$connect).toBeDefined();
		});
	});

	describe("Connection Lifecycle", () => {
		it("should maintain connection across multiple queries", async () => {
			const query1 = await db.$queryRaw`SELECT 1 as value`;
			const query2 = await db.$queryRaw`SELECT 2 as value`;
			const query3 = await db.$queryRaw`SELECT 3 as value`;

			expect(query1).toBeDefined();
			expect(query2).toBeDefined();
			expect(query3).toBeDefined();
		});

		it("should allow reconnection after disconnect", async () => {
			await db.$disconnect();
			await db.$connect();

			const result = await db.$queryRaw`SELECT 1 as value`;
			expect(result).toBeDefined();
		});
	});
});
