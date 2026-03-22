import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { feedbackRouter } from "./router";

const { mockLoggerError } = vi.hoisted(() => ({
	mockLoggerError: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: {
		error: mockLoggerError,
	},
}));

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

const createToolFeedbackMock = vi.hoisted(() => vi.fn());
const getToolJobByIdMock = vi.hoisted(() => vi.fn());
const getToolFeedbackMock = vi.hoisted(() => vi.fn());
const countToolFeedbackMock = vi.hoisted(() => vi.fn());
const getToolFeedbackStatsMock = vi.hoisted(() => vi.fn());
const getUserFeedbackForJobMock = vi.hoisted(() => vi.fn());
const getToolFeedbackByIdMock = vi.hoisted(() => vi.fn());
const updateToolFeedbackMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	createToolFeedback: createToolFeedbackMock,
	getToolJobById: getToolJobByIdMock,
	getToolFeedback: getToolFeedbackMock,
	countToolFeedback: countToolFeedbackMock,
	getToolFeedbackStats: getToolFeedbackStatsMock,
	getUserFeedbackForJob: getUserFeedbackForJobMock,
	getToolFeedbackById: getToolFeedbackByIdMock,
	updateToolFeedback: updateToolFeedbackMock,
	zodSchemas: {
		FeedbackRatingSchema: z.enum(["POSITIVE", "NEGATIVE"]),
	},
}));

const mockSession = {
	user: {
		id: "user-1",
		email: "user@example.com",
		name: "Test User",
		role: "member",
	},
	session: { id: "session-1", activeOrganizationId: "org-1" },
};

const makeContext = () => ({ headers: new Headers() });

describe("Feedback Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
	});

	describe("feedback.create", () => {
		const createClient = () =>
			createProcedureClient(feedbackRouter.create, {
				context: makeContext(),
			});

		it("creates feedback without job reference", async () => {
			const mockFeedback = {
				id: "fb-1",
				toolSlug: "pdf-converter",
				rating: "POSITIVE",
				userId: "user-1",
			};
			createToolFeedbackMock.mockResolvedValue(mockFeedback);

			const client = createClient();
			const result = await client({
				toolSlug: "pdf-converter",
				rating: "POSITIVE" as never,
			});

			expect(createToolFeedbackMock).toHaveBeenCalledWith({
				toolSlug: "pdf-converter",
				userId: "user-1",
				rating: "POSITIVE",
				jobId: undefined,
				chatTranscript: undefined,
				extractedData: undefined,
			});
			expect(result).toEqual({ feedback: mockFeedback });
		});

		it("throws NOT_FOUND when job does not exist", async () => {
			getToolJobByIdMock.mockResolvedValue(null);

			const client = createClient();
			await expect(
				client({
					toolSlug: "pdf-converter",
					rating: "POSITIVE" as never,
					jobId: "job-999",
				}),
			).rejects.toThrow();

			expect(createToolFeedbackMock).not.toHaveBeenCalled();
		});

		it("throws FORBIDDEN when job belongs to different user", async () => {
			getToolJobByIdMock.mockResolvedValue({
				id: "job-1",
				userId: "other-user",
				toolSlug: "pdf-converter",
			});

			const client = createClient();
			await expect(
				client({
					toolSlug: "pdf-converter",
					rating: "POSITIVE" as never,
					jobId: "job-1",
				}),
			).rejects.toThrow();

			expect(createToolFeedbackMock).not.toHaveBeenCalled();
		});

		it("throws BAD_REQUEST when tool slug does not match job", async () => {
			getToolJobByIdMock.mockResolvedValue({
				id: "job-1",
				userId: "user-1",
				toolSlug: "image-converter",
			});

			const client = createClient();
			await expect(
				client({
					toolSlug: "pdf-converter",
					rating: "POSITIVE" as never,
					jobId: "job-1",
				}),
			).rejects.toThrow();

			expect(createToolFeedbackMock).not.toHaveBeenCalled();
		});

		it("throws INTERNAL_SERVER_ERROR when createToolFeedback fails", async () => {
			createToolFeedbackMock.mockRejectedValue(new Error("DB error"));

			const client = createClient();
			await expect(
				client({
					toolSlug: "pdf-converter",
					rating: "POSITIVE" as never,
				}),
			).rejects.toThrow();

			expect(mockLoggerError).toHaveBeenCalled();
		});
	});

	describe("feedback.list", () => {
		const createClient = () =>
			createProcedureClient(feedbackRouter.list, {
				context: makeContext(),
			});

		it("returns feedback list and total", async () => {
			const items = [{ id: "fb-1", toolSlug: "pdf-converter" }];
			getToolFeedbackMock.mockResolvedValue(items);
			countToolFeedbackMock.mockResolvedValue(1);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ feedback: items, total: 1 });
		});

		it("filters by myFeedbackOnly using user id", async () => {
			getToolFeedbackMock.mockResolvedValue([]);
			countToolFeedbackMock.mockResolvedValue(0);

			const client = createClient();
			await client({ myFeedbackOnly: true });

			expect(getToolFeedbackMock).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "user-1" }),
			);
		});
	});

	describe("feedback.stats", () => {
		const createClient = () =>
			createProcedureClient(feedbackRouter.stats, {
				context: makeContext(),
			});

		it("returns stats for all tools", async () => {
			const stats = [{ toolSlug: "pdf-converter", count: 5 }];
			getToolFeedbackStatsMock.mockResolvedValue(stats);

			const client = createClient();
			const result = await client({});

			expect(getToolFeedbackStatsMock).toHaveBeenCalledWith(undefined);
			expect(result).toEqual({ stats });
		});

		it("passes toolSlug filter when provided", async () => {
			getToolFeedbackStatsMock.mockResolvedValue([]);

			const client = createClient();
			await client({ toolSlug: "pdf-converter" });

			expect(getToolFeedbackStatsMock).toHaveBeenCalledWith(
				"pdf-converter",
			);
		});
	});

	describe("feedback.getForJob", () => {
		const createClient = () =>
			createProcedureClient(feedbackRouter.getForJob, {
				context: makeContext(),
			});

		it("returns user feedback for a job", async () => {
			const fb = { id: "fb-1", jobId: "job-1" };
			getUserFeedbackForJobMock.mockResolvedValue(fb);

			const client = createClient();
			const result = await client({ jobId: "job-1" });

			expect(getUserFeedbackForJobMock).toHaveBeenCalledWith(
				"user-1",
				"job-1",
			);
			expect(result).toEqual({ feedback: fb });
		});

		it("returns null feedback when no feedback exists for job", async () => {
			getUserFeedbackForJobMock.mockResolvedValue(null);

			const client = createClient();
			const result = await client({ jobId: "job-no-feedback" });

			expect(result).toEqual({ feedback: null });
		});
	});

	describe("feedback.update", () => {
		const existingFeedback = {
			id: "fb-1",
			userId: "user-1",
			rating: "POSITIVE",
		};

		const createClient = () =>
			createProcedureClient(feedbackRouter.update, {
				context: makeContext(),
			});

		it("updates feedback and returns updated record", async () => {
			const updatedFeedback = {
				...existingFeedback,
				chatTranscript: "Updated",
			};
			getToolFeedbackByIdMock
				.mockResolvedValueOnce(existingFeedback)
				.mockResolvedValueOnce(updatedFeedback);
			updateToolFeedbackMock.mockResolvedValue(undefined);

			const client = createClient();
			const result = await client({
				feedbackId: "fb-1",
				chatTranscript: "Updated",
			});

			expect(updateToolFeedbackMock).toHaveBeenCalledWith(
				"fb-1",
				"user-1",
				expect.any(Object),
			);
			expect(result).toEqual({ feedback: updatedFeedback });
		});

		it("throws NOT_FOUND when feedback does not exist", async () => {
			getToolFeedbackByIdMock.mockResolvedValue(null);

			const client = createClient();
			await expect(
				client({ feedbackId: "fb-missing" }),
			).rejects.toThrow();

			expect(updateToolFeedbackMock).not.toHaveBeenCalled();
		});

		it("throws FORBIDDEN when feedback belongs to different user", async () => {
			getToolFeedbackByIdMock.mockResolvedValue({
				id: "fb-1",
				userId: "other-user",
			});

			const client = createClient();
			await expect(client({ feedbackId: "fb-1" })).rejects.toThrow();

			expect(updateToolFeedbackMock).not.toHaveBeenCalled();
		});

		it("throws INTERNAL_SERVER_ERROR when update fails", async () => {
			getToolFeedbackByIdMock.mockResolvedValue(existingFeedback);
			updateToolFeedbackMock.mockRejectedValue(new Error("DB error"));

			const client = createClient();
			await expect(client({ feedbackId: "fb-1" })).rejects.toThrow();

			expect(mockLoggerError).toHaveBeenCalled();
		});
	});
});
