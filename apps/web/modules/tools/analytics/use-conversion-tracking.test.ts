import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConversionTracking } from "./use-conversion-tracking";

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

describe("useConversionTracking", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLocalStorage.clear();
	});

	describe("trackCreditsPurchaseStarted", () => {
		it("should track credits purchase started event", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test_123");

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackCreditsPurchaseStarted({
				creditPackage: "basic",
				priceCents: 499,
				toolName: "news-analyzer",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"credits_purchase_started",
				expect.objectContaining({
					session_id: "sess_test_123",
					credit_package: "basic",
					price_cents: 499,
					tool_name: "news-analyzer",
				}),
			);
		});

		it("should track without optional properties", () => {
			mockLocalStorage.getItem.mockReturnValue(null);

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackCreditsPurchaseStarted();

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"credits_purchase_started",
				expect.objectContaining({
					session_id: undefined,
				}),
			);
		});
	});

	describe("trackCreditsPurchaseCompleted", () => {
		it("should track credits purchase completed event", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test_123");

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackCreditsPurchaseCompleted({
				creditPackage: "pro",
				creditsAmount: 100,
				priceCents: 999,
				toolName: "news-analyzer",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"credits_purchase_completed",
				expect.objectContaining({
					session_id: "sess_test_123",
					credit_package: "pro",
					credits_amount: 100,
					price_cents: 999,
					tool_name: "news-analyzer",
				}),
			);
		});
	});

	describe("trackAccountCreatedFromTool", () => {
		it("should track account creation from tool with previous session", () => {
			const previousSession = "sess_anonymous_456";
			mockLocalStorage.getItem.mockReturnValue(previousSession);

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackAccountCreatedFromTool({
				signupMethod: "google",
				toolName: "news-analyzer",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"account_created_from_tool",
				expect.objectContaining({
					previous_session_id: previousSession,
					signup_method: "google",
					tool_name: "news-analyzer",
				}),
			);
		});

		it("should track account creation with email signup", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackAccountCreatedFromTool({
				signupMethod: "email",
				toolName: "file-processor",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"account_created_from_tool",
				expect.objectContaining({
					signup_method: "email",
					tool_name: "file-processor",
				}),
			);
		});

		it("should track account creation with github signup", () => {
			mockLocalStorage.getItem.mockReturnValue("sess_test");

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackAccountCreatedFromTool({
				signupMethod: "github",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"account_created_from_tool",
				expect.objectContaining({
					signup_method: "github",
				}),
			);
		});

		it("should handle no previous session", () => {
			mockLocalStorage.getItem.mockReturnValue(null);

			const { result } = renderHook(() => useConversionTracking());

			result.current.trackAccountCreatedFromTool({
				signupMethod: "email",
			});

			expect(mockTrackEvent).toHaveBeenCalledWith(
				"account_created_from_tool",
				expect.objectContaining({
					previous_session_id: undefined,
				}),
			);
		});
	});
});
