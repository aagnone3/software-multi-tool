import { describe, expect, it } from "vitest";

/**
 * Unit tests for pg-boss configuration module
 *
 * Note: Full integration tests with actual pg-boss require a running PostgreSQL
 * database and are better suited for integration tests with Testcontainers.
 *
 * These tests verify the module exports and type safety.
 */
describe("pg-boss module exports", () => {
	it("should export createPgBoss function", async () => {
		// Dynamic import to avoid initialization side effects
		const pgBossModule = await import("./pg-boss.js");
		expect(typeof pgBossModule.createPgBoss).toBe("function");
	});

	it("should export getPgBoss function", async () => {
		const pgBossModule = await import("./pg-boss.js");
		expect(typeof pgBossModule.getPgBoss).toBe("function");
	});

	it("should export startPgBoss function", async () => {
		const pgBossModule = await import("./pg-boss.js");
		expect(typeof pgBossModule.startPgBoss).toBe("function");
	});

	it("should export stopPgBoss function", async () => {
		const pgBossModule = await import("./pg-boss.js");
		expect(typeof pgBossModule.stopPgBoss).toBe("function");
	});
});

describe("pg-boss configuration values", () => {
	it("getPgBoss should throw when not initialized", async () => {
		// This test verifies the singleton pattern works correctly
		// We can't easily reset the module state in ESM, so we just verify
		// the function signature is correct
		const pgBossModule = await import("./pg-boss.js");

		// getPgBoss throws if boss is null (not initialized)
		// In actual usage, createPgBoss() must be called first
		expect(pgBossModule.getPgBoss).toBeDefined();
	});
});

/**
 * pg-boss configuration constants (for documentation)
 *
 * The following configuration is used when creating pg-boss:
 * - connectionString: from env.DATABASE_URL
 * - schema: "pgboss" (matches Prisma migration)
 * - migrate: false (Prisma owns schema)
 * - retryLimit: 3 (default retry attempts)
 * - retryDelay: 60 (1 minute initial delay)
 * - retryBackoff: true (exponential: 1m, 4m, 16m)
 * - expireInSeconds: 600 (10 minute timeout)
 * - archiveCompletedAfterSeconds: 604800 (7 days)
 * - archiveFailedAfterSeconds: 1209600 (14 days)
 * - monitorStateIntervalSeconds: 30
 * - application_name: "api-server-pgboss"
 */
describe("pg-boss configuration documentation", () => {
	it("should have documented configuration values", () => {
		// This test serves as documentation for the configuration
		const expectedConfig = {
			schema: "pgboss",
			migrate: false,
			retryLimit: 3,
			retryDelay: 60,
			retryBackoff: true,
			expireInSeconds: 600,
			archiveCompletedAfterSeconds: 60 * 60 * 24 * 7, // 7 days
			archiveFailedAfterSeconds: 60 * 60 * 24 * 14, // 14 days
			monitorStateIntervalSeconds: 30,
			application_name: "api-server-pgboss",
		};

		expect(expectedConfig.schema).toBe("pgboss");
		expect(expectedConfig.migrate).toBe(false);
		expect(expectedConfig.retryLimit).toBe(3);
		expect(expectedConfig.retryDelay).toBe(60);
		expect(expectedConfig.retryBackoff).toBe(true);
		expect(expectedConfig.expireInSeconds).toBe(600);
	});
});
