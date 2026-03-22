import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	toolJobCreate: vi.fn(),
	toolJobFindUnique: vi.fn(),
	toolJobFindMany: vi.fn(),
	toolJobFindFirst: vi.fn(),
	toolJobUpdate: vi.fn(),
	toolJobUpdateMany: vi.fn(),
	toolJobDelete: vi.fn(),
	toolJobDeleteMany: vi.fn(),
	toolJobCount: vi.fn(),
	queryRaw: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		toolJob: {
			create: mocks.toolJobCreate,
			findUnique: mocks.toolJobFindUnique,
			findMany: mocks.toolJobFindMany,
			findFirst: mocks.toolJobFindFirst,
			update: mocks.toolJobUpdate,
			updateMany: mocks.toolJobUpdateMany,
			delete: mocks.toolJobDelete,
			deleteMany: mocks.toolJobDeleteMany,
			count: mocks.toolJobCount,
		},
		$queryRaw: mocks.queryRaw,
	},
}));

import {
	cancelToolJob,
	claimNextPendingJob,
	cleanupExpiredJobs,
	createToolJob,
	deleteToolJob,
	findCachedJob,
	getJobStats,
	getJobsToRetry,
	getStuckJobs,
	getToolJobById,
	getToolJobsBySessionId,
	getToolJobsByUserId,
	markJobCompleted,
	markJobFailed,
	markStuckJobsAsFailed,
	requeueJob,
} from "./tool-jobs";

describe("tool-jobs queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("createToolJob", () => {
		it("creates a job with defaults", async () => {
			const mockJob = { id: "job-1", toolSlug: "news-analyzer" };
			mocks.toolJobCreate.mockResolvedValue(mockJob);

			const result = await createToolJob({
				toolSlug: "news-analyzer",
				input: { url: "https://example.com" },
				userId: "user-1",
			});

			expect(result).toEqual(mockJob);
			expect(mocks.toolJobCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						toolSlug: "news-analyzer",
						priority: 0,
						maxAttempts: 3,
					}),
				}),
			);
		});

		it("creates a job with custom priority and maxAttempts", async () => {
			mocks.toolJobCreate.mockResolvedValue({ id: "job-2" });

			await createToolJob({
				toolSlug: "expense-analyzer",
				input: {},
				priority: 5,
				maxAttempts: 1,
			});

			expect(mocks.toolJobCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						priority: 5,
						maxAttempts: 1,
					}),
				}),
			);
		});
	});

	describe("getToolJobById", () => {
		it("returns job with newsAnalysis include", async () => {
			const mockJob = { id: "job-1", newsAnalysis: null };
			mocks.toolJobFindUnique.mockResolvedValue(mockJob);

			const result = await getToolJobById("job-1");

			expect(result).toEqual(mockJob);
			expect(mocks.toolJobFindUnique).toHaveBeenCalledWith({
				where: { id: "job-1" },
				include: { newsAnalysis: true },
			});
		});

		it("returns null when not found", async () => {
			mocks.toolJobFindUnique.mockResolvedValue(null);
			expect(await getToolJobById("missing")).toBeNull();
		});
	});

	describe("getToolJobsByUserId", () => {
		it("returns jobs for user with default limit/offset", async () => {
			const mockJobs = [{ id: "job-1" }];
			mocks.toolJobFindMany.mockResolvedValue(mockJobs);

			const result = await getToolJobsByUserId({ userId: "user-1" });

			expect(result).toEqual(mockJobs);
			expect(mocks.toolJobFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: "user-1" },
					take: 20,
					skip: 0,
					include: { newsAnalysis: true },
				}),
			);
		});

		it("filters by toolSlug when provided", async () => {
			mocks.toolJobFindMany.mockResolvedValue([]);
			await getToolJobsByUserId({
				userId: "user-1",
				toolSlug: "invoice",
			});
			expect(mocks.toolJobFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: "user-1", toolSlug: "invoice" },
				}),
			);
		});
	});

	describe("getToolJobsBySessionId", () => {
		it("returns jobs for session", async () => {
			mocks.toolJobFindMany.mockResolvedValue([{ id: "job-2" }]);

			const result = await getToolJobsBySessionId({
				sessionId: "sess-1",
			});

			expect(result).toHaveLength(1);
			expect(mocks.toolJobFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { sessionId: "sess-1" },
					take: 20,
					skip: 0,
				}),
			);
		});
	});

	describe("cancelToolJob", () => {
		it("sets status to CANCELLED", async () => {
			mocks.toolJobUpdate.mockResolvedValue({
				id: "job-1",
				status: "CANCELLED",
			});
			await cancelToolJob("job-1");
			expect(mocks.toolJobUpdate).toHaveBeenCalledWith({
				where: { id: "job-1" },
				data: { status: "CANCELLED" },
			});
		});
	});

	describe("deleteToolJob", () => {
		it("deletes job by id", async () => {
			mocks.toolJobDelete.mockResolvedValue({ id: "job-1" });
			await deleteToolJob("job-1");
			expect(mocks.toolJobDelete).toHaveBeenCalledWith({
				where: { id: "job-1" },
			});
		});
	});

	describe("claimNextPendingJob", () => {
		it("returns null when no pending job", async () => {
			mocks.queryRaw.mockResolvedValue([]);
			const result = await claimNextPendingJob();
			expect(result).toBeNull();
		});

		it("returns the claimed job when one is found", async () => {
			const mockJob = { id: "job-1", toolSlug: "news-analyzer" };
			mocks.queryRaw.mockResolvedValue([{ id: "job-1" }]);
			mocks.toolJobFindUnique.mockResolvedValue(mockJob);

			const result = await claimNextPendingJob();

			expect(result).toEqual(mockJob);
			expect(mocks.toolJobFindUnique).toHaveBeenCalledWith({
				where: { id: "job-1" },
				include: { newsAnalysis: true },
			});
		});

		it("passes toolSlug filter when provided", async () => {
			mocks.queryRaw.mockResolvedValue([]);
			await claimNextPendingJob("news-analyzer");
			expect(mocks.queryRaw).toHaveBeenCalled();
		});
	});

	describe("markJobCompleted", () => {
		it("sets status to COMPLETED with output and completedAt", async () => {
			mocks.toolJobUpdate.mockResolvedValue({
				id: "job-1",
				status: "COMPLETED",
			});
			await markJobCompleted("job-1", { result: "done" });
			expect(mocks.toolJobUpdate).toHaveBeenCalledWith({
				where: { id: "job-1" },
				data: expect.objectContaining({
					status: "COMPLETED",
					output: { result: "done" },
				}),
			});
		});
	});

	describe("markJobFailed", () => {
		it("sets status to FAILED with error message", async () => {
			mocks.toolJobUpdate.mockResolvedValue({
				id: "job-1",
				status: "FAILED",
			});
			await markJobFailed("job-1", "timeout");
			expect(mocks.toolJobUpdate).toHaveBeenCalledWith({
				where: { id: "job-1" },
				data: expect.objectContaining({
					status: "FAILED",
					error: "timeout",
				}),
			});
		});
	});

	describe("requeueJob", () => {
		it("sets status back to PENDING", async () => {
			mocks.toolJobUpdate.mockResolvedValue({
				id: "job-1",
				status: "PENDING",
			});
			await requeueJob("job-1");
			expect(mocks.toolJobUpdate).toHaveBeenCalledWith({
				where: { id: "job-1" },
				data: expect.objectContaining({ status: "PENDING" }),
			});
		});
	});

	describe("getJobsToRetry", () => {
		it("calls queryRaw to find failed jobs under maxAttempts", async () => {
			mocks.queryRaw.mockResolvedValue([{ id: "job-1" }]);
			const result = await getJobsToRetry();
			expect(result).toHaveLength(1);
			expect(mocks.queryRaw).toHaveBeenCalled();
		});
	});

	describe("getStuckJobs", () => {
		it("returns jobs stuck in PROCESSING state beyond timeout", async () => {
			mocks.toolJobFindMany.mockResolvedValue([{ id: "job-stuck" }]);
			const result = await getStuckJobs(30);
			expect(result).toHaveLength(1);
			expect(mocks.toolJobFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ status: "PROCESSING" }),
				}),
			);
		});
	});

	describe("markStuckJobsAsFailed", () => {
		it("marks processing jobs beyond timeout as FAILED", async () => {
			mocks.toolJobUpdateMany.mockResolvedValue({ count: 2 });
			const result = await markStuckJobsAsFailed();
			expect(mocks.toolJobUpdateMany).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						status: "FAILED",
						error: "Job timed out",
					}),
				}),
			);
			expect(result).toEqual({ count: 2 });
		});
	});

	describe("cleanupExpiredJobs", () => {
		it("deletes expired terminal-status jobs", async () => {
			mocks.toolJobDeleteMany.mockResolvedValue({ count: 3 });
			const result = await cleanupExpiredJobs();
			expect(mocks.toolJobDeleteMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: { in: ["COMPLETED", "FAILED", "CANCELLED"] },
					}),
				}),
			);
			expect(result).toEqual({ count: 3 });
		});
	});

	describe("getJobStats", () => {
		it("returns counts for all statuses", async () => {
			mocks.toolJobCount
				.mockResolvedValueOnce(5) // pending
				.mockResolvedValueOnce(2) // processing
				.mockResolvedValueOnce(10) // completed
				.mockResolvedValueOnce(1) // failed
				.mockResolvedValueOnce(3); // cancelled

			const result = await getJobStats();

			expect(result).toEqual({
				pending: 5,
				processing: 2,
				completed: 10,
				failed: 1,
				cancelled: 3,
			});
		});

		it("filters by toolSlug when provided", async () => {
			mocks.toolJobCount.mockResolvedValue(0);
			await getJobStats("news-analyzer");
			expect(mocks.toolJobCount).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						toolSlug: "news-analyzer",
					}),
				}),
			);
		});
	});

	describe("findCachedJob", () => {
		it("returns cached completed job when found", async () => {
			const mockJob = { id: "job-cached", status: "COMPLETED" };
			mocks.toolJobFindFirst.mockResolvedValue(mockJob);

			const result = await findCachedJob("news-analyzer", {
				url: "https://example.com",
			});

			expect(result).toEqual(mockJob);
			expect(mocks.toolJobFindFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						toolSlug: "news-analyzer",
						status: "COMPLETED",
					}),
				}),
			);
		});

		it("returns null when no cached job found", async () => {
			mocks.toolJobFindFirst.mockResolvedValue(null);
			const result = await findCachedJob("invoice", {});
			expect(result).toBeNull();
		});
	});
});
