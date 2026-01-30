import type { FeedbackRating, Prisma } from "@prisma/client";
import { db } from "../client";

interface CreateToolFeedbackInput {
	toolSlug: string;
	userId: string;
	rating: FeedbackRating;
	jobId?: string;
	chatTranscript?: string;
	extractedData?: unknown;
}

export async function createToolFeedback({
	toolSlug,
	userId,
	rating,
	jobId,
	chatTranscript,
	extractedData,
}: CreateToolFeedbackInput) {
	return await db.toolFeedback.create({
		data: {
			toolSlug,
			userId,
			rating,
			jobId,
			chatTranscript,
			extractedData: extractedData as Prisma.InputJsonValue | undefined,
		},
	});
}

interface GetToolFeedbackInput {
	limit: number;
	offset: number;
	toolSlug?: string;
	userId?: string;
	rating?: FeedbackRating;
}

export async function getToolFeedback({
	limit,
	offset,
	toolSlug,
	userId,
	rating,
}: GetToolFeedbackInput) {
	const where: Prisma.ToolFeedbackWhereInput = {};

	if (toolSlug) {
		where.toolSlug = toolSlug;
	}

	if (userId) {
		where.userId = userId;
	}

	if (rating) {
		where.rating = rating;
	}

	return await db.toolFeedback.findMany({
		where,
		take: limit,
		skip: offset,
		orderBy: { createdAt: "desc" },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
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
}

export async function countToolFeedback({
	toolSlug,
	userId,
	rating,
}: Omit<GetToolFeedbackInput, "limit" | "offset">) {
	const where: Prisma.ToolFeedbackWhereInput = {};

	if (toolSlug) {
		where.toolSlug = toolSlug;
	}

	if (userId) {
		where.userId = userId;
	}

	if (rating) {
		where.rating = rating;
	}

	return await db.toolFeedback.count({ where });
}

export async function getToolFeedbackById(feedbackId: string) {
	return await db.toolFeedback.findUnique({
		where: { id: feedbackId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
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
}

export async function getToolFeedbackByJobId(jobId: string) {
	return await db.toolFeedback.findMany({
		where: { jobId },
		orderBy: { createdAt: "desc" },
	});
}

export async function getToolFeedbackStats(toolSlug?: string) {
	const where: Prisma.ToolFeedbackWhereInput = {};

	if (toolSlug) {
		where.toolSlug = toolSlug;
	}

	const [positiveCount, negativeCount] = await Promise.all([
		db.toolFeedback.count({
			where: { ...where, rating: "POSITIVE" },
		}),
		db.toolFeedback.count({
			where: { ...where, rating: "NEGATIVE" },
		}),
	]);

	const total = positiveCount + negativeCount;
	const positiveRate = total > 0 ? positiveCount / total : 0;

	return {
		positiveCount,
		negativeCount,
		total,
		positiveRate,
	};
}

export async function updateToolFeedback(
	feedbackId: string,
	userId: string,
	data: {
		chatTranscript?: string;
		extractedData?: unknown;
	},
) {
	const updateData: Prisma.ToolFeedbackUpdateInput = {};
	if (data.chatTranscript !== undefined) {
		updateData.chatTranscript = data.chatTranscript;
	}
	if (data.extractedData !== undefined) {
		updateData.extractedData = data.extractedData as Prisma.InputJsonValue;
	}

	return await db.toolFeedback.updateMany({
		where: {
			id: feedbackId,
			userId, // Ensure user owns the feedback
		},
		data: updateData,
	});
}
