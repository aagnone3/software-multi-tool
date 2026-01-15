import { describe, expect, it } from "vitest";
import {
	ARCHIVE_CONFIG,
	JOB_EXPIRE_IN_INTERVAL,
	JOB_TIMEOUT_MS,
	JOB_TIMEOUT_SECONDS,
	RETRY_CONFIG,
	STUCK_JOB_TIMEOUT_MINUTES,
	WORKER_CONFIG,
} from "./job-config";

describe("job-config", () => {
	describe("timeout values", () => {
		it("JOB_TIMEOUT_MS is 10 minutes", () => {
			expect(JOB_TIMEOUT_MS).toBe(10 * 60 * 1000);
		});

		it("JOB_TIMEOUT_SECONDS matches JOB_TIMEOUT_MS", () => {
			expect(JOB_TIMEOUT_SECONDS).toBe(JOB_TIMEOUT_MS / 1000);
		});

		it("JOB_EXPIRE_IN_INTERVAL is 10 minutes in PostgreSQL format", () => {
			expect(JOB_EXPIRE_IN_INTERVAL).toBe("00:10:00");
		});

		it("STUCK_JOB_TIMEOUT_MINUTES is greater than JOB_TIMEOUT_SECONDS / 60", () => {
			// Stuck job timeout should be longer than pg-boss expiration
			// to allow pg-boss to handle expiration first
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

	describe("archive configuration", () => {
		it("archives completed jobs after 7 days", () => {
			expect(ARCHIVE_CONFIG.completedAfterSeconds).toBe(60 * 60 * 24 * 7);
		});

		it("archives failed jobs after 14 days", () => {
			expect(ARCHIVE_CONFIG.failedAfterSeconds).toBe(60 * 60 * 24 * 14);
		});

		it("keeps failed jobs longer than completed jobs", () => {
			expect(ARCHIVE_CONFIG.failedAfterSeconds).toBeGreaterThan(
				ARCHIVE_CONFIG.completedAfterSeconds,
			);
		});
	});

	describe("worker configuration", () => {
		it("has reasonable batch size", () => {
			expect(WORKER_CONFIG.batchSize).toBeGreaterThan(0);
			expect(WORKER_CONFIG.batchSize).toBeLessThanOrEqual(100);
		});

		it("has polling interval less than 1 minute", () => {
			expect(WORKER_CONFIG.pollingIntervalSeconds).toBeLessThan(60);
		});

		it("has monitor state interval for stats reporting", () => {
			expect(WORKER_CONFIG.monitorStateIntervalSeconds).toBeGreaterThan(
				0,
			);
		});
	});
});
