import { describe, expect, it } from "vitest";
import {
	DEFAULT_JOB_TIMEOUT_MS,
	getProcessor,
	getRegisteredTools,
	hasProcessor,
	registerProcessor,
	withTimeout,
} from "./processor-registry";

describe("processor-registry", () => {
	describe("withTimeout", () => {
		it("should resolve if promise completes before timeout", async () => {
			const fastPromise = Promise.resolve("success");
			const result = await withTimeout(fastPromise, 1000);
			expect(result).toBe("success");
		});

		it("should reject with timeout error if promise takes too long", async () => {
			const slowPromise = new Promise((resolve) =>
				setTimeout(() => resolve("success"), 200),
			);

			await expect(withTimeout(slowPromise, 50)).rejects.toThrow(
				"Job processing timed out after 50ms",
			);
		});

		it("should use default timeout if none provided", async () => {
			expect(DEFAULT_JOB_TIMEOUT_MS).toBe(5 * 60 * 1000); // 5 minutes
		});

		it("should propagate original error if promise rejects before timeout", async () => {
			const failingPromise = Promise.reject(new Error("Original error"));

			await expect(withTimeout(failingPromise, 1000)).rejects.toThrow(
				"Original error",
			);
		});

		it("should return the resolved value with correct type", async () => {
			interface TestResult {
				success: boolean;
				output: string;
			}

			const typedPromise = Promise.resolve<TestResult>({
				success: true,
				output: "test output",
			});

			const result = await withTimeout(typedPromise, 1000);
			expect(result.success).toBe(true);
			expect(result.output).toBe("test output");
		});
	});

	describe("processor registration", () => {
		it("should register and retrieve a processor", () => {
			const testProcessor = async () => ({ success: true as const });
			registerProcessor("test-tool", testProcessor);

			expect(hasProcessor("test-tool")).toBe(true);
			expect(getProcessor("test-tool")).toBe(testProcessor);
		});

		it("should return undefined for unregistered processor", () => {
			expect(hasProcessor("nonexistent-tool")).toBe(false);
			expect(getProcessor("nonexistent-tool")).toBeUndefined();
		});

		it("should list all registered tools", () => {
			const tools = getRegisteredTools();
			expect(Array.isArray(tools)).toBe(true);
			expect(tools).toContain("test-tool");
		});
	});

	describe("DEFAULT_JOB_TIMEOUT_MS", () => {
		it("should be 5 minutes (300000ms)", () => {
			expect(DEFAULT_JOB_TIMEOUT_MS).toBe(300000);
		});
	});
});
