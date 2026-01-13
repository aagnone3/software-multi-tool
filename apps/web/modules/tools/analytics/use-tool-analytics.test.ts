import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToolAnalytics } from "./use-tool-analytics";

// Mock the analytics module
const mockTrackEvent = vi.fn();
vi.mock("@analytics", () => ({
	useAnalytics: () => ({
		trackEvent: mockTrackEvent,
	}),
}));

// Mock localStorage
const mockLocalStorage = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("useToolAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLocalStorage.clear();
	});

	describe("session management", () => {
		it("should create a new session ID if none exists", () => {
			mockLocalStorage.getItem.mockReturnValue(null);

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "test-tool" }),
			);

			expect(result.current.sessionId).toBeTruthy();
			expect(result.current.sessionId).toMatch(/^sess_/);
		});

		it("should reuse existing session ID", () => {
			const existingSessionId = "sess_123_abc";
			mockLocalStorage.getItem.mockReturnValue(existingSessionId);

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "test-tool" }),
			);

			expect(result.current.sessionId).toBe(existingSessionId);
		});
	});

	describe("trackToolViewed", () => {
		it("should track tool viewed event with base properties", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackToolViewed();

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_viewed",
				expect.objectContaining({
					tool_name: "news-analyzer",
					session_id: "sess_test",
					is_authenticated: false,
				}),
			);
		});

		it("should include referrer when provided", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackToolViewed({ referrer: "https://google.com" });

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_viewed",
				expect.objectContaining({
					referrer: "https://google.com",
				}),
			);
		});
	});

	describe("trackUploadStarted", () => {
		it("should track upload started event", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "file-processor" }),
			);

			result.current.trackUploadStarted({
				fileType: "application/pdf",
				fileSize: 1024000,
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_upload_started",
				expect.objectContaining({
					tool_name: "file-processor",
					file_type: "application/pdf",
					file_size: 1024000,
				}),
			);
		});
	});

	describe("trackProcessingStarted", () => {
		it("should track processing started event", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackProcessingStarted({
				jobId: "job-123",
				fromCache: false,
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_processing_started",
				expect.objectContaining({
					tool_name: "news-analyzer",
					job_id: "job-123",
					from_cache: false,
				}),
			);
		});
	});

	describe("trackProcessingCompleted", () => {
		it("should track processing completed event with duration", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackProcessingCompleted({
				jobId: "job-123",
				processingDurationMs: 5000,
				fromCache: true,
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_processing_completed",
				expect.objectContaining({
					tool_name: "news-analyzer",
					job_id: "job-123",
					processing_duration_ms: 5000,
					from_cache: true,
				}),
			);
		});
	});

	describe("trackProcessingFailed", () => {
		it("should track processing failed event with error type", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackProcessingFailed({
				jobId: "job-123",
				errorType: "timeout",
				processingDurationMs: 30000,
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_processing_failed",
				expect.objectContaining({
					tool_name: "news-analyzer",
					job_id: "job-123",
					error_type: "timeout",
					processing_duration_ms: 30000,
				}),
			);
		});
	});

	describe("trackResultDownloaded", () => {
		it("should track result downloaded event", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackResultDownloaded({
				jobId: "job-123",
				downloadFormat: "json",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_result_downloaded",
				expect.objectContaining({
					tool_name: "news-analyzer",
					job_id: "job-123",
					download_format: "json",
				}),
			);
		});
	});

	describe("isAuthenticated flag", () => {
		it("should include is_authenticated: true when authenticated", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({
					toolName: "news-analyzer",
					isAuthenticated: true,
				}),
			);

			result.current.trackToolViewed();

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_viewed",
				expect.objectContaining({
					is_authenticated: true,
				}),
			);
		});

		it("should include is_authenticated: false when not authenticated", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({
					toolName: "news-analyzer",
					isAuthenticated: false,
				}),
			);

			result.current.trackToolViewed();

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_viewed",
				expect.objectContaining({
					is_authenticated: false,
				}),
			);
		});
	});

	describe("trackToolEvent (generic)", () => {
		it("should track any tool event with custom properties", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() =>
				useToolAnalytics({ toolName: "news-analyzer" }),
			);

			result.current.trackToolEvent("tool_viewed", {
				page_path: "/tools/news-analyzer",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"tool_viewed",
				expect.objectContaining({
					tool_name: "news-analyzer",
					page_path: "/tools/news-analyzer",
				}),
			);
		});
	});
});
