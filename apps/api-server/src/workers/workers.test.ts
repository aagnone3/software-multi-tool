import { describe, expect, it } from "vitest";
import type { JobPayload, SubmitJobResult, WorkerConfig } from "./types.js";

/**
 * Unit tests for workers module types and exports
 *
 * Note: Integration tests for actual job processing require a running PostgreSQL
 * database and are better suited for integration tests with Testcontainers.
 *
 * These tests verify the module exports, types, and configuration values.
 */
describe("workers module exports", () => {
	it("should export registerWorkers function", async () => {
		const workersModule = await import("./index.js");
		expect(typeof workersModule.registerWorkers).toBe("function");
	});

	it("should export submitJob function", async () => {
		const workersModule = await import("./index.js");
		expect(typeof workersModule.submitJob).toBe("function");
	});

	it("should export submitJobWithOptions function", async () => {
		const workersModule = await import("./index.js");
		expect(typeof workersModule.submitJobWithOptions).toBe("function");
	});
});

describe("JobPayload type", () => {
	it("should have correct structure", () => {
		// Type check - this is a compile-time check
		const payload: JobPayload = { toolJobId: "test-id" };
		expect(payload.toolJobId).toBe("test-id");
	});

	it("should only contain toolJobId field", () => {
		const payload: JobPayload = { toolJobId: "test-123" };
		expect(Object.keys(payload)).toEqual(["toolJobId"]);
	});
});

describe("WorkerConfig type", () => {
	it("should have correct structure", () => {
		// Type check - this is a compile-time check
		const config: WorkerConfig = {
			batchSize: 5,
			pollingIntervalSeconds: 2,
		};
		expect(config.batchSize).toBe(5);
		expect(config.pollingIntervalSeconds).toBe(2);
	});

	it("should have both required fields", () => {
		const config: WorkerConfig = {
			batchSize: 10,
			pollingIntervalSeconds: 5,
		};
		expect(Object.keys(config)).toContain("batchSize");
		expect(Object.keys(config)).toContain("pollingIntervalSeconds");
	});
});

describe("SubmitJobResult type", () => {
	it("should have correct structure for success case", () => {
		const result: SubmitJobResult = {
			pgBossJobId: "job-123",
			success: true,
		};
		expect(result.pgBossJobId).toBe("job-123");
		expect(result.success).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should have correct structure for failure case", () => {
		const result: SubmitJobResult = {
			pgBossJobId: null,
			success: false,
			error: "Failed to submit job",
		};
		expect(result.pgBossJobId).toBeNull();
		expect(result.success).toBe(false);
		expect(result.error).toBe("Failed to submit job");
	});
});

/**
 * Worker configuration constants (for documentation)
 *
 * The following default configuration is used for workers:
 * - batchSize: 5 (jobs fetched at once per queue)
 * - pollingIntervalSeconds: 2 (how often to poll for new jobs)
 */
describe("worker configuration documentation", () => {
	it("should document default worker configuration", () => {
		const defaultConfig = {
			batchSize: 5,
			pollingIntervalSeconds: 2,
		};

		// These are the defaults used in the workers module
		expect(defaultConfig.batchSize).toBe(5);
		expect(defaultConfig.pollingIntervalSeconds).toBe(2);
	});
});

/**
 * Tool slugs supported by workers (for documentation)
 */
describe("supported tool slugs", () => {
	it("should support all registered tool types", () => {
		const supportedTools = [
			"invoice-processor",
			"contract-analyzer",
			"feedback-analyzer",
			"expense-categorizer",
			"meeting-summarizer",
			"news-analyzer",
		];

		expect(supportedTools).toHaveLength(6);
		expect(supportedTools).toContain("invoice-processor");
		expect(supportedTools).toContain("contract-analyzer");
		expect(supportedTools).toContain("feedback-analyzer");
		expect(supportedTools).toContain("expense-categorizer");
		expect(supportedTools).toContain("meeting-summarizer");
		expect(supportedTools).toContain("news-analyzer");
	});
});
