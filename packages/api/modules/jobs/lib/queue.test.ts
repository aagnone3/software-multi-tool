import { beforeEach, describe, expect, it, vi } from "vitest";
import { arePgBossWorkersActive, submitJobToQueue } from "./queue";

// Mock @repo/logs
vi.mock("@repo/logs", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { logger } from "@repo/logs";

describe("queue", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("submitJobToQueue (deprecated)", () => {
		it("should return null and log deprecation warning", async () => {
			const result = await submitJobToQueue("news-analyzer", "job-123", {
				priority: 5,
			});

			expect(result).toBeNull();
			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("[DEPRECATED] submitJobToQueue()"),
			);
		});

		it("should include queue name and job ID in warning", async () => {
			await submitJobToQueue("speaker-separation", "job-456");

			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("queue=speaker-separation"),
			);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("toolJobId=job-456"),
			);
		});
	});

	describe("arePgBossWorkersActive (deprecated)", () => {
		it("should return false and log deprecation warning", async () => {
			const result = await arePgBossWorkersActive();

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining(
					"[DEPRECATED] arePgBossWorkersActive()",
				),
			);
		});
	});
});
