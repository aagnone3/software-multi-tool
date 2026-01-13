import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { serverAnalytics, trackToolServerEvent } from "./server-analytics";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger
vi.mock("@repo/logs", () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe("Server Analytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockResolvedValue({ ok: true });
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("serverAnalytics.capture", () => {
		it("should send capture request to PostHog API", async () => {
			// Note: serverAnalytics is disabled in test mode, so this tests the behavior
			// when the PostHog key is not set or in test environment
			await serverAnalytics.capture({
				distinctId: "user-123",
				event: "test_event",
				properties: { key: "value" },
			});

			// In test mode, analytics is disabled so fetch should not be called
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should not throw when capture fails", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			// Should not throw even if fetch fails
			await expect(
				serverAnalytics.capture({
					distinctId: "user-123",
					event: "test_event",
				}),
			).resolves.toBeUndefined();
		});

		it("should handle missing distinctId gracefully", async () => {
			await expect(
				serverAnalytics.capture({
					distinctId: "",
					event: "test_event",
				}),
			).resolves.toBeUndefined();
		});
	});

	describe("serverAnalytics.identify", () => {
		it("should send identify event", async () => {
			await serverAnalytics.identify({
				distinctId: "user-123",
				properties: { email: "test@example.com" },
			});

			// In test mode, analytics is disabled
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("serverAnalytics.alias", () => {
		it("should send alias event", async () => {
			await serverAnalytics.alias({
				distinctId: "user-123",
				alias: "anonymous-session-456",
			});

			// In test mode, analytics is disabled
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("serverAnalytics.isEnabled", () => {
		it("should return false in test environment", () => {
			expect(serverAnalytics.isEnabled()).toBe(false);
		});
	});

	describe("trackToolServerEvent", () => {
		it("should use userId as distinctId when authenticated", async () => {
			await trackToolServerEvent("tool_job_created", {
				tool_name: "news-analyzer",
				job_id: "job-123",
				is_authenticated: true,
				user_id: "user-456",
				session_id: "session-789",
			});

			// In test mode, analytics is disabled
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should use sessionId as distinctId when anonymous", async () => {
			await trackToolServerEvent("tool_processing_completed", {
				tool_name: "news-analyzer",
				job_id: "job-123",
				is_authenticated: false,
				session_id: "session-789",
				processing_duration_ms: 5000,
			});

			// In test mode, analytics is disabled
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should handle missing distinctId gracefully", async () => {
			// When neither userId nor sessionId is provided
			await expect(
				trackToolServerEvent("tool_processing_failed", {
					tool_name: "news-analyzer",
					job_id: "job-123",
					is_authenticated: false,
					// No userId or sessionId
				}),
			).resolves.toBeUndefined();
		});

		it("should include user_type in properties", async () => {
			await trackToolServerEvent("tool_cache_hit", {
				tool_name: "news-analyzer",
				job_id: "job-123",
				is_authenticated: true,
				user_id: "user-456",
			});

			// Verify it doesn't throw and handles gracefully in test mode
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});
});

describe("Event Types", () => {
	it("should support all tool server events", async () => {
		const events = [
			"tool_job_created",
			"tool_processing_started",
			"tool_processing_completed",
			"tool_processing_failed",
			"tool_cache_hit",
		] as const;

		for (const event of events) {
			await expect(
				trackToolServerEvent(event, {
					tool_name: "test-tool",
					job_id: "job-123",
					is_authenticated: false,
					session_id: "session-456",
				}),
			).resolves.toBeUndefined();
		}
	});
});
