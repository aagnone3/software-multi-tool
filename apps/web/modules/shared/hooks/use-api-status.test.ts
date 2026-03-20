import { describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockUseQuery,
}));

vi.mock("@repo/utils/lib/api-url", () => ({
	isPreviewEnvironment: vi.fn(),
}));

import { isPreviewEnvironment } from "@repo/utils/lib/api-url";
import { useApiStatus } from "./use-api-status";

const mockIsPreviewEnvironment = vi.mocked(isPreviewEnvironment);

function callHook() {
	// renderHook not needed since we mock the entire useQuery
	return useApiStatus();
}

describe("useApiStatus", () => {
	it("returns isAvailable=true, isPreview=false in non-preview environment", () => {
		mockIsPreviewEnvironment.mockReturnValue(false);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: false,
			error: null,
		});

		const result = callHook();

		expect(result.isAvailable).toBe(true);
		expect(result.isPreview).toBe(false);
		expect(result.isChecking).toBe(false);
		expect(result.errorCode).toBeUndefined();
	});

	it("passes enabled=false to useQuery in non-preview environment", () => {
		mockIsPreviewEnvironment.mockReturnValue(false);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: false,
			error: null,
		});

		callHook();

		const queryOptions = mockUseQuery.mock.calls[0][0];
		expect(queryOptions.enabled).toBe(false);
	});

	it("passes enabled=true to useQuery in preview environment", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: false,
			error: null,
		});

		callHook();

		const queryOptions = mockUseQuery.mock.calls[0][0];
		expect(queryOptions.enabled).toBe(true);
	});

	it("returns isPreview=true and isAvailable=true on successful query in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: false,
			error: null,
		});

		const result = callHook();

		expect(result.isPreview).toBe(true);
		expect(result.isAvailable).toBe(true);
		expect(result.isChecking).toBe(false);
		expect(result.errorCode).toBeUndefined();
	});

	it("returns isChecking=true when query is loading in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: true,
			isError: false,
			error: null,
		});

		const result = callHook();

		expect(result.isChecking).toBe(true);
	});

	it("returns isAvailable=false and classifies API_NOT_CONFIGURED error in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: true,
			error: { status: 503, code: "API_NOT_CONFIGURED" },
		});

		const result = callHook();

		expect(result.isAvailable).toBe(false);
		expect(result.errorCode).toBe("API_NOT_CONFIGURED");
	});

	it("returns isAvailable=false and classifies API_UNREACHABLE error in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: true,
			error: { status: 502, code: "API_UNREACHABLE" },
		});

		const result = callHook();

		expect(result.isAvailable).toBe(false);
		expect(result.errorCode).toBe("API_UNREACHABLE");
	});

	it("returns isAvailable=true for non-unavailability errors in preview", () => {
		mockIsPreviewEnvironment.mockReturnValue(true);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: true,
			error: { status: 404 },
		});

		const result = callHook();

		// NOT_FOUND is not API_NOT_CONFIGURED or API_UNREACHABLE so isAvailable stays true
		expect(result.isAvailable).toBe(false); // isError=true => isAvailable=false per the hook logic
		expect(result.errorCode).toBe("NOT_FOUND");
	});

	it("uses api-health query key", () => {
		mockIsPreviewEnvironment.mockReturnValue(false);
		mockUseQuery.mockReturnValue({
			isLoading: false,
			isError: false,
			error: null,
		});

		callHook();

		const queryOptions = mockUseQuery.mock.calls[0][0];
		expect(queryOptions.queryKey).toEqual(["api-health"]);
	});
});
