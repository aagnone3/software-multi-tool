import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	toolFeedbackCreate: vi.fn(),
	toolFeedbackFindMany: vi.fn(),
	toolFeedbackFindUnique: vi.fn(),
	toolFeedbackCount: vi.fn(),
	toolFeedbackUpdateMany: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		toolFeedback: {
			create: mocks.toolFeedbackCreate,
			findMany: mocks.toolFeedbackFindMany,
			findUnique: mocks.toolFeedbackFindUnique,
			count: mocks.toolFeedbackCount,
			updateMany: mocks.toolFeedbackUpdateMany,
		},
	},
}));

import {
	countToolFeedback,
	createToolFeedback,
	getToolFeedback,
	getToolFeedbackById,
	getToolFeedbackByJobId,
	getToolFeedbackStats,
	updateToolFeedback,
} from "./tool-feedback";

describe("tool feedback queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("createToolFeedback", () => {
		it("creates feedback with required fields", async () => {
			const mockFeedback = {
				id: "feedback-1",
				toolSlug: "news-analyzer",
				userId: "user-1",
				rating: "POSITIVE",
				jobId: null,
				chatTranscript: null,
				extractedData: null,
				createdAt: new Date(),
			};
			mocks.toolFeedbackCreate.mockResolvedValueOnce(mockFeedback);

			const result = await createToolFeedback({
				toolSlug: "news-analyzer",
				userId: "user-1",
				rating: "POSITIVE",
			});

			expect(result).toEqual(mockFeedback);
			expect(mocks.toolFeedbackCreate).toHaveBeenCalledWith({
				data: {
					toolSlug: "news-analyzer",
					userId: "user-1",
					rating: "POSITIVE",
					jobId: undefined,
					chatTranscript: undefined,
					extractedData: undefined,
				},
			});
		});

		it("creates feedback with optional fields", async () => {
			const extractedData = { sentiment: "positive", issues: [] };
			const mockFeedback = {
				id: "feedback-2",
				toolSlug: "news-analyzer",
				userId: "user-1",
				rating: "NEGATIVE",
				jobId: "job-1",
				chatTranscript:
					"User: The results were wrong\nAssistant: I understand...",
				extractedData,
				createdAt: new Date(),
			};
			mocks.toolFeedbackCreate.mockResolvedValueOnce(mockFeedback);

			const result = await createToolFeedback({
				toolSlug: "news-analyzer",
				userId: "user-1",
				rating: "NEGATIVE",
				jobId: "job-1",
				chatTranscript:
					"User: The results were wrong\nAssistant: I understand...",
				extractedData,
			});

			expect(result).toEqual(mockFeedback);
			expect(mocks.toolFeedbackCreate).toHaveBeenCalledWith({
				data: {
					toolSlug: "news-analyzer",
					userId: "user-1",
					rating: "NEGATIVE",
					jobId: "job-1",
					chatTranscript:
						"User: The results were wrong\nAssistant: I understand...",
					extractedData,
				},
			});
		});
	});

	describe("getToolFeedback", () => {
		const mockUser = {
			id: "user-1",
			name: "Test User",
			email: "test@example.com",
		};
		const mockJob = {
			id: "job-1",
			toolSlug: "news-analyzer",
			status: "completed",
			createdAt: new Date(),
		};

		it("returns feedback with pagination", async () => {
			const mockFeedback = [
				{
					id: "feedback-1",
					toolSlug: "news-analyzer",
					rating: "POSITIVE",
					user: mockUser,
					job: null,
				},
			];
			mocks.toolFeedbackFindMany.mockResolvedValueOnce(mockFeedback);

			const result = await getToolFeedback({ limit: 10, offset: 0 });

			expect(result).toEqual(mockFeedback);
			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith({
				where: {},
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
				include: {
					user: {
						select: { id: true, name: true, email: true },
					},
					job: {
						select: {
							id: true,
							toolSlug: true,
							status: true,
							createdAt: true,
						},
					},
				},
			});
		});

		it("filters by toolSlug", async () => {
			mocks.toolFeedbackFindMany.mockResolvedValueOnce([]);

			await getToolFeedback({
				limit: 10,
				offset: 0,
				toolSlug: "news-analyzer",
			});

			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { toolSlug: "news-analyzer" },
				}),
			);
		});

		it("filters by userId", async () => {
			mocks.toolFeedbackFindMany.mockResolvedValueOnce([]);

			await getToolFeedback({ limit: 10, offset: 0, userId: "user-1" });

			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: "user-1" },
				}),
			);
		});

		it("filters by rating", async () => {
			mocks.toolFeedbackFindMany.mockResolvedValueOnce([]);

			await getToolFeedback({ limit: 10, offset: 0, rating: "NEGATIVE" });

			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { rating: "NEGATIVE" },
				}),
			);
		});

		it("applies multiple filters", async () => {
			mocks.toolFeedbackFindMany.mockResolvedValueOnce([]);

			await getToolFeedback({
				limit: 20,
				offset: 10,
				toolSlug: "news-analyzer",
				userId: "user-1",
				rating: "POSITIVE",
			});

			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						toolSlug: "news-analyzer",
						userId: "user-1",
						rating: "POSITIVE",
					},
					take: 20,
					skip: 10,
				}),
			);
		});
	});

	describe("countToolFeedback", () => {
		it("counts all feedback when no filters", async () => {
			mocks.toolFeedbackCount.mockResolvedValueOnce(42);

			const result = await countToolFeedback({});

			expect(result).toBe(42);
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({ where: {} });
		});

		it("counts feedback with filters", async () => {
			mocks.toolFeedbackCount.mockResolvedValueOnce(15);

			const result = await countToolFeedback({
				toolSlug: "news-analyzer",
				rating: "POSITIVE",
			});

			expect(result).toBe(15);
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({
				where: { toolSlug: "news-analyzer", rating: "POSITIVE" },
			});
		});
	});

	describe("getToolFeedbackById", () => {
		it("returns feedback with user and job relations", async () => {
			const mockFeedback = {
				id: "feedback-1",
				toolSlug: "news-analyzer",
				rating: "POSITIVE",
				user: { id: "user-1", name: "Test", email: "test@example.com" },
				job: {
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "completed",
					createdAt: new Date(),
				},
			};
			mocks.toolFeedbackFindUnique.mockResolvedValueOnce(mockFeedback);

			const result = await getToolFeedbackById("feedback-1");

			expect(result).toEqual(mockFeedback);
			expect(mocks.toolFeedbackFindUnique).toHaveBeenCalledWith({
				where: { id: "feedback-1" },
				include: {
					user: {
						select: { id: true, name: true, email: true },
					},
					job: {
						select: {
							id: true,
							toolSlug: true,
							status: true,
							createdAt: true,
						},
					},
				},
			});
		});

		it("returns null when feedback not found", async () => {
			mocks.toolFeedbackFindUnique.mockResolvedValueOnce(null);

			const result = await getToolFeedbackById("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("getToolFeedbackByJobId", () => {
		it("returns all feedback for a job", async () => {
			const mockFeedback = [
				{ id: "feedback-1", jobId: "job-1", rating: "POSITIVE" },
				{ id: "feedback-2", jobId: "job-1", rating: "NEGATIVE" },
			];
			mocks.toolFeedbackFindMany.mockResolvedValueOnce(mockFeedback);

			const result = await getToolFeedbackByJobId("job-1");

			expect(result).toEqual(mockFeedback);
			expect(mocks.toolFeedbackFindMany).toHaveBeenCalledWith({
				where: { jobId: "job-1" },
				orderBy: { createdAt: "desc" },
			});
		});

		it("returns empty array when no feedback for job", async () => {
			mocks.toolFeedbackFindMany.mockResolvedValueOnce([]);

			const result = await getToolFeedbackByJobId("job-without-feedback");

			expect(result).toEqual([]);
		});
	});

	describe("getToolFeedbackStats", () => {
		it("returns stats for all tools when no toolSlug", async () => {
			mocks.toolFeedbackCount
				.mockResolvedValueOnce(30) // positive
				.mockResolvedValueOnce(10); // negative

			const result = await getToolFeedbackStats();

			expect(result).toEqual({
				positiveCount: 30,
				negativeCount: 10,
				total: 40,
				positiveRate: 0.75,
			});
			expect(mocks.toolFeedbackCount).toHaveBeenCalledTimes(2);
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({
				where: { rating: "POSITIVE" },
			});
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({
				where: { rating: "NEGATIVE" },
			});
		});

		it("returns stats for specific tool", async () => {
			mocks.toolFeedbackCount
				.mockResolvedValueOnce(20) // positive
				.mockResolvedValueOnce(5); // negative

			const result = await getToolFeedbackStats("news-analyzer");

			expect(result).toEqual({
				positiveCount: 20,
				negativeCount: 5,
				total: 25,
				positiveRate: 0.8,
			});
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({
				where: { toolSlug: "news-analyzer", rating: "POSITIVE" },
			});
			expect(mocks.toolFeedbackCount).toHaveBeenCalledWith({
				where: { toolSlug: "news-analyzer", rating: "NEGATIVE" },
			});
		});

		it("returns zero rate when no feedback", async () => {
			mocks.toolFeedbackCount
				.mockResolvedValueOnce(0) // positive
				.mockResolvedValueOnce(0); // negative

			const result = await getToolFeedbackStats("new-tool");

			expect(result).toEqual({
				positiveCount: 0,
				negativeCount: 0,
				total: 0,
				positiveRate: 0,
			});
		});
	});

	describe("updateToolFeedback", () => {
		it("updates chatTranscript for user-owned feedback", async () => {
			mocks.toolFeedbackUpdateMany.mockResolvedValueOnce({ count: 1 });

			const result = await updateToolFeedback("feedback-1", "user-1", {
				chatTranscript: "Updated conversation...",
			});

			expect(result).toEqual({ count: 1 });
			expect(mocks.toolFeedbackUpdateMany).toHaveBeenCalledWith({
				where: {
					id: "feedback-1",
					userId: "user-1",
				},
				data: {
					chatTranscript: "Updated conversation...",
				},
			});
		});

		it("updates extractedData for user-owned feedback", async () => {
			const extractedData = {
				sentiment: "negative",
				suggestions: ["improve speed"],
			};
			mocks.toolFeedbackUpdateMany.mockResolvedValueOnce({ count: 1 });

			const result = await updateToolFeedback("feedback-1", "user-1", {
				extractedData,
			});

			expect(result).toEqual({ count: 1 });
			expect(mocks.toolFeedbackUpdateMany).toHaveBeenCalledWith({
				where: {
					id: "feedback-1",
					userId: "user-1",
				},
				data: {
					extractedData,
				},
			});
		});

		it("updates both fields", async () => {
			const extractedData = { summary: "User liked the tool" };
			mocks.toolFeedbackUpdateMany.mockResolvedValueOnce({ count: 1 });

			const result = await updateToolFeedback("feedback-1", "user-1", {
				chatTranscript: "Full conversation...",
				extractedData,
			});

			expect(result).toEqual({ count: 1 });
			expect(mocks.toolFeedbackUpdateMany).toHaveBeenCalledWith({
				where: {
					id: "feedback-1",
					userId: "user-1",
				},
				data: {
					chatTranscript: "Full conversation...",
					extractedData,
				},
			});
		});

		it("returns count 0 when feedback not found or not owned by user", async () => {
			mocks.toolFeedbackUpdateMany.mockResolvedValueOnce({ count: 0 });

			const result = await updateToolFeedback(
				"feedback-1",
				"wrong-user",
				{
					chatTranscript: "Attempted update",
				},
			);

			expect(result).toEqual({ count: 0 });
		});
	});
});
