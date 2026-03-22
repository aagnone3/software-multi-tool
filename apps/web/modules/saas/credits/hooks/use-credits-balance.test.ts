import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreditsBalance } from "./use-credits-balance";

const useQueryMock = vi.hoisted(() => vi.fn());
const useActiveOrganizationMock = vi.hoisted(() => vi.fn());
const classifyErrorMock = vi.hoisted(() => vi.fn());
const isApiInitializingMock = vi.hoisted(() => vi.fn(() => false));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
}));

vi.mock("../../organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: useActiveOrganizationMock,
}));

vi.mock("@shared/lib/api-error-utils", () => ({
	classifyError: classifyErrorMock,
	isApiInitializing: isApiInitializingMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			balance: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "balance"],
				})),
			},
		},
	},
}));

const mockBalance = {
	included: 1000,
	used: 400,
	remaining: 600,
	overage: 0,
	purchasedCredits: 200,
	totalAvailable: 800,
	periodStart: "2026-03-01T00:00:00Z",
	periodEnd: "2026-03-31T00:00:00Z",
	plan: { id: "pro", name: "Pro" },
	purchases: [],
};

describe("useCreditsBalance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: { id: "org-1" },
		});
	});

	it("returns loading state", () => {
		useQueryMock.mockReturnValue({
			isLoading: true,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsBalance());
		expect(result.current.isLoading).toBe(true);
		expect(result.current.balance).toBeUndefined();
	});

	it("returns balance data with computed fields", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: mockBalance,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsBalance());
		expect(result.current.balance).toEqual(mockBalance);
		// totalCredits = included + purchasedCredits = 1000 + 200 = 1200
		expect(result.current.totalCredits).toBe(1200);
		// percentageUsed = round(400/1200 * 100) = 33
		expect(result.current.percentageUsed).toBe(33);
		// isLowCredits: 800/1200 = 0.667 > 0.2, so false
		expect(result.current.isLowCredits).toBe(false);
	});

	it("detects low credits", () => {
		const lowBalance = {
			...mockBalance,
			remaining: 50,
			purchasedCredits: 0,
			totalAvailable: 50,
		};
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: lowBalance,
			error: null,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsBalance());
		// totalCredits = 1000, totalAvailable = 50, 50/1000 = 0.05 < 0.2 → low
		expect(result.current.isLowCredits).toBe(true);
	});

	it("disables query when no active organization", () => {
		useActiveOrganizationMock.mockReturnValue({ activeOrganization: null });
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: false,
			data: undefined,
			error: null,
			refetch: vi.fn(),
		});
		renderHook(() => useCreditsBalance());
		const callArgs = useQueryMock.mock.calls[0][0];
		expect(callArgs.enabled).toBe(false);
	});

	it("classifies error when present", () => {
		const err = new Error("unauthorized");
		classifyErrorMock.mockReturnValue("UNAUTHORIZED");
		useQueryMock.mockReturnValue({
			isLoading: false,
			isError: true,
			data: undefined,
			error: err,
			refetch: vi.fn(),
		});
		const { result } = renderHook(() => useCreditsBalance());
		expect(result.current.errorCode).toBe("UNAUTHORIZED");
	});
});
