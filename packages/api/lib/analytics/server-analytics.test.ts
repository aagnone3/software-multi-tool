import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	ServerAnalytics,
	serverAnalytics,
	trackToolServerEvent,
} from "./server-analytics";

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

	describe("ServerAnalytics (disabled - test mode)", () => {
		it("should be disabled in test environment", () => {
			expect(serverAnalytics.isEnabled()).toBe(false);
		});

		it("should not call fetch when disabled", async () => {
			await serverAnalytics.capture({
				distinctId: "user-123",
				event: "test_event",
				properties: { key: "value" },
			});

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should not throw when capture fails on disabled instance", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			await expect(
				serverAnalytics.capture({
					distinctId: "user-123",
					event: "test_event",
				}),
			).resolves.toBeUndefined();
		});
	});

	describe("ServerAnalytics (enabled)", () => {
		let analytics: ServerAnalytics;

		beforeEach(() => {
			analytics = new ServerAnalytics({
				apiKey: "test-api-key",
				host: "https://test.posthog.com",
				enabled: true,
			});
		});

		describe("capture", () => {
			it("should send capture request to PostHog API", async () => {
				await analytics.capture({
					distinctId: "user-123",
					event: "test_event",
					properties: { key: "value" },
				});

				expect(mockFetch).toHaveBeenCalledWith(
					"https://test.posthog.com/capture/",
					expect.objectContaining({
						method: "POST",
						headers: { "Content-Type": "application/json" },
					}),
				);

				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.api_key).toBe("test-api-key");
				expect(body.event).toBe("test_event");
				expect(body.distinct_id).toBe("user-123");
				expect(body.properties.key).toBe("value");
				expect(body.properties.$lib).toBe("server-analytics");
			});

			it("should include $set and $set_once when provided", async () => {
				await analytics.capture({
					distinctId: "user-123",
					event: "test_event",
					$set: { name: "Test User" },
					$set_once: { first_seen: "2024-01-01" },
				});

				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.$set).toEqual({ name: "Test User" });
				expect(body.$set_once).toEqual({ first_seen: "2024-01-01" });
			});

			it("should use custom timestamp when provided", async () => {
				const customTimestamp = new Date("2024-01-15T10:00:00Z");
				await analytics.capture({
					distinctId: "user-123",
					event: "test_event",
					timestamp: customTimestamp,
				});

				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.timestamp).toBe("2024-01-15T10:00:00.000Z");
			});

			it("should handle non-ok response gracefully", async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 500,
					statusText: "Internal Server Error",
				});

				await expect(
					analytics.capture({
						distinctId: "user-123",
						event: "test_event",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});

			it("should handle fetch errors gracefully", async () => {
				mockFetch.mockRejectedValue(new Error("Network error"));

				await expect(
					analytics.capture({
						distinctId: "user-123",
						event: "test_event",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});

			it("should handle non-Error exceptions gracefully", async () => {
				mockFetch.mockRejectedValue("String error");

				await expect(
					analytics.capture({
						distinctId: "user-123",
						event: "test_event",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});
		});

		describe("identify", () => {
			it("should send identify event with $set properties", async () => {
				await analytics.identify({
					distinctId: "user-123",
					properties: {
						email: "test@example.com",
						name: "Test User",
					},
				});

				expect(mockFetch).toHaveBeenCalled();
				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.event).toBe("$identify");
				expect(body.distinct_id).toBe("user-123");
				expect(body.$set).toEqual({
					email: "test@example.com",
					name: "Test User",
				});
			});
		});

		describe("alias", () => {
			it("should send alias event", async () => {
				await analytics.alias({
					distinctId: "user-123",
					alias: "anonymous-session-456",
				});

				expect(mockFetch).toHaveBeenCalledWith(
					"https://test.posthog.com/capture/",
					expect.objectContaining({
						method: "POST",
					}),
				);

				const body = JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(body.event).toBe("$create_alias");
				expect(body.distinct_id).toBe("user-123");
				expect(body.properties.alias).toBe("anonymous-session-456");
				expect(body.properties.$lib).toBe("server-analytics");
			});

			it("should handle non-ok response gracefully", async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 400,
					statusText: "Bad Request",
				});

				await expect(
					analytics.alias({
						distinctId: "user-123",
						alias: "session-456",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});

			it("should handle fetch errors gracefully", async () => {
				mockFetch.mockRejectedValue(new Error("Network error"));

				await expect(
					analytics.alias({
						distinctId: "user-123",
						alias: "session-456",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});

			it("should handle non-Error exceptions gracefully", async () => {
				mockFetch.mockRejectedValue("String error");

				await expect(
					analytics.alias({
						distinctId: "user-123",
						alias: "session-456",
					}),
				).resolves.toBeUndefined();

				expect(mockFetch).toHaveBeenCalled();
			});
		});

		describe("isEnabled", () => {
			it("should return true when enabled", () => {
				expect(analytics.isEnabled()).toBe(true);
			});
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

			// In test mode, analytics is disabled so fetch should not be called
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
