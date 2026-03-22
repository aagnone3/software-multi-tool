import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useJobPolling, useJobsList } from "./use-job-polling";

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseQueryClient = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockUseQuery,
	useMutation: mockUseMutation,
	useQueryClient: mockUseQueryClient,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			get: {
				queryOptions: vi.fn((opts: { input: { jobId: string } }) => ({
					queryKey: ["jobs.get", opts.input.jobId],
					queryFn: vi.fn(),
				})),
			},
			list: {
				queryOptions: vi.fn(
					(opts: { input: { toolSlug?: string } }) => ({
						queryKey: ["jobs.list", opts.input.toolSlug],
						queryFn: vi.fn(),
					}),
				),
			},
			create: {
				mutationOptions: vi.fn(() => ({
					mutationKey: ["jobs.create"],
					mutationFn: vi.fn(),
				})),
			},
			cancel: {
				mutationOptions: vi.fn(() => ({
					mutationKey: ["jobs.cancel"],
					mutationFn: vi.fn(),
				})),
			},
		},
	},
}));

describe("useJobPolling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseQueryClient.mockReturnValue({
			invalidateQueries: mockInvalidateQueries,
		});
	});

	it("returns undefined job when no jobId", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useJobPolling(undefined));

		expect(result.current.job).toBeUndefined();
		expect(result.current.isLoading).toBe(false);
	});

	it("returns job when data is present", () => {
		const mockJob = { id: "job-1", status: "COMPLETED" };
		mockUseQuery.mockReturnValue({
			data: { job: mockJob },
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useJobPolling("job-1"));

		expect(result.current.job).toEqual(mockJob);
	});

	it("passes enabled:false when jobId is not provided", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderHook(() => useJobPolling(undefined));

		const callArg = mockUseQuery.mock.calls[0][0];
		expect(callArg.enabled).toBe(false);
	});

	it("passes enabled:true when jobId is provided", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderHook(() => useJobPolling("job-1"));

		const callArg = mockUseQuery.mock.calls[0][0];
		expect(callArg.enabled).toBe(true);
	});

	it("invalidateJob calls invalidateQueries with correct key", async () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useJobPolling("job-1"));
		result.current.invalidateJob();

		expect(mockInvalidateQueries).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: expect.arrayContaining(["jobs.get"]),
			}),
		);
	});

	describe("refetchInterval", () => {
		function getRefetchInterval(status: string | undefined) {
			mockUseQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: null,
				refetch: vi.fn(),
			});
			renderHook(() => useJobPolling("job-1"));
			const callArg = mockUseQuery.mock.calls[0][0];
			return callArg.refetchInterval({
				state: { data: status ? { job: { status } } : undefined },
			});
		}

		it("returns 2000ms when no status", () => {
			expect(getRefetchInterval(undefined)).toBe(2000);
		});

		it("returns 2000ms for PROCESSING", () => {
			expect(getRefetchInterval("PROCESSING")).toBe(2000);
		});

		it("returns 5000ms for PENDING", () => {
			expect(getRefetchInterval("PENDING")).toBe(5000);
		});

		it("returns false for COMPLETED", () => {
			expect(getRefetchInterval("COMPLETED")).toBe(false);
		});

		it("returns false for FAILED", () => {
			expect(getRefetchInterval("FAILED")).toBe(false);
		});
	});
});

describe("useJobsList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty jobs array when no data", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useJobsList());

		expect(result.current.jobs).toEqual([]);
	});

	it("returns jobs from data", () => {
		const mockJobs = [{ id: "job-1" }, { id: "job-2" }];
		mockUseQuery.mockReturnValue({
			data: { jobs: mockJobs },
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useJobsList());

		expect(result.current.jobs).toEqual(mockJobs);
	});
});
