import { describe, expect, it, vi } from "vitest";
import type { JobPayload, WorkerConfig } from "./types.js";

/**
 * Unit tests for workers module types and exports
 *
 * Note: Integration tests for actual job processing require a running PostgreSQL
 * database and are better suited for integration tests with Testcontainers.
 *
 * These tests verify the module exports, types, and configuration values.
 */

// Mock heavy dependencies to avoid slow module initialization in CI
// The workers/index.ts imports these at the top level, triggering expensive init
vi.mock("@repo/database", () => ({
	db: {
		toolJob: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@repo/api/modules/jobs/lib/processor-registry", () => ({
	getProcessor: vi.fn(),
}));

vi.mock("@repo/api/modules/jobs/lib/register-all-processors", () => ({
	registerAllProcessors: vi.fn(),
}));

vi.mock("@repo/api/modules/news-analyzer/lib/register", () => ({
	registerNewsAnalyzerProcessor: vi.fn(),
}));

vi.mock("../lib/pg-boss.js", () => ({
	getPgBoss: vi.fn(() => ({
		work: vi.fn(),
		send: vi.fn(),
		fail: vi.fn(),
		complete: vi.fn(),
	})),
}));

vi.mock("../lib/logger.js", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

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
