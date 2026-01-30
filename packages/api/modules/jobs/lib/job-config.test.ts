import { describe, expect, it } from "vitest";
import {
	JOB_TIMEOUT_MS,
	JOB_TIMEOUT_SECONDS,
	RETRY_CONFIG,
	STUCK_JOB_TIMEOUT_MINUTES,
} from "./job-config";

describe("job-config", () => {
	describe("timeout values", () => {
		it("JOB_TIMEOUT_MS is 10 minutes", () => {
			expect(JOB_TIMEOUT_MS).toBe(10 * 60 * 1000);
		});

		it("JOB_TIMEOUT_SECONDS matches JOB_TIMEOUT_MS", () => {
			expect(JOB_TIMEOUT_SECONDS).toBe(JOB_TIMEOUT_MS / 1000);
		});

		it("STUCK_JOB_TIMEOUT_MINUTES is greater than JOB_TIMEOUT_SECONDS / 60", () => {
			// Stuck job timeout should be longer than Inngest step timeout
			// to allow Inngest retries to complete first
			expect(STUCK_JOB_TIMEOUT_MINUTES).toBeGreaterThan(
				JOB_TIMEOUT_SECONDS / 60,
			);
		});
	});

	describe("retry configuration", () => {
		it("has retry limit of 3", () => {
			expect(RETRY_CONFIG.limit).toBe(3);
		});

		it("has initial retry delay of 60 seconds", () => {
			expect(RETRY_CONFIG.delay).toBe(60);
		});

		it("has exponential backoff enabled", () => {
			expect(RETRY_CONFIG.backoff).toBe(true);
		});
	});
});
