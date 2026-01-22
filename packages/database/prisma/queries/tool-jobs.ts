import type { Prisma, ToolJobStatus } from "@prisma/client";
import { db } from "../client";

// Default expiration time: 7 days
const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreateToolJobInput {
	toolSlug: string;
	input: Prisma.InputJsonValue;
	userId?: string;
	sessionId?: string;
	priority?: number;
	maxAttempts?: number;
	expiresAt?: Date;
}

export async function createToolJob({
	toolSlug,
	input,
	userId,
	sessionId,
	priority = 0,
	maxAttempts = 3,
	expiresAt,
}: CreateToolJobInput) {
	return await db.toolJob.create({
		data: {
			toolSlug,
			input,
			userId,
			sessionId,
			priority,
			maxAttempts,
			expiresAt:
				expiresAt ?? new Date(Date.now() + DEFAULT_EXPIRATION_MS),
		},
	});
}

export async function getToolJobById(id: string) {
	return await db.toolJob.findUnique({
		where: { id },
		include: { newsAnalysis: true },
	});
}

export async function getToolJobsByUserId({
	userId,
	toolSlug,
	limit = 20,
	offset = 0,
}: {
	userId: string;
	toolSlug?: string;
	limit?: number;
	offset?: number;
}) {
	return await db.toolJob.findMany({
		where: {
			userId,
			...(toolSlug && { toolSlug }),
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
		include: { newsAnalysis: true },
	});
}

export async function getToolJobsBySessionId({
	sessionId,
	toolSlug,
	limit = 20,
	offset = 0,
}: {
	sessionId: string;
	toolSlug?: string;
	limit?: number;
	offset?: number;
}) {
	return await db.toolJob.findMany({
		where: {
			sessionId,
			...(toolSlug && { toolSlug }),
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
		include: { newsAnalysis: true },
	});
}

export async function cancelToolJob(id: string) {
	return await db.toolJob.update({
		where: { id },
		data: { status: "CANCELLED" },
	});
}

export async function deleteToolJob(id: string) {
	return await db.toolJob.delete({
		where: { id },
	});
}

export async function claimNextPendingJob(toolSlug?: string) {
	// Use a transaction with raw SQL for atomic update
	// This prevents race conditions when multiple workers try to claim the same job

	// Build the query conditionally to avoid Prisma.sql nesting issues
	const result = toolSlug
		? await db.$queryRaw<Array<{ id: string }>>`
			UPDATE "tool_job"
			SET status = 'PROCESSING',
				"startedAt" = NOW(),
				attempts = attempts + 1,
				"updatedAt" = NOW()
			WHERE id = (
				SELECT id FROM "tool_job"
				WHERE status = 'PENDING'
				AND "toolSlug" = ${toolSlug}
				ORDER BY priority DESC, "createdAt" ASC
				FOR UPDATE SKIP LOCKED
				LIMIT 1
			)
			RETURNING id
		`
		: await db.$queryRaw<Array<{ id: string }>>`
			UPDATE "tool_job"
			SET status = 'PROCESSING',
				"startedAt" = NOW(),
				attempts = attempts + 1,
				"updatedAt" = NOW()
			WHERE id = (
				SELECT id FROM "tool_job"
				WHERE status = 'PENDING'
				ORDER BY priority DESC, "createdAt" ASC
				FOR UPDATE SKIP LOCKED
				LIMIT 1
			)
			RETURNING id
		`;

	if (result.length === 0) {
		return null;
	}

	return await db.toolJob.findUnique({
		where: { id: result[0].id },
	});
}

export async function markJobCompleted(
	id: string,
	output: Prisma.InputJsonValue,
) {
	return await db.toolJob.update({
		where: { id },
		data: {
			status: "COMPLETED",
			output,
			completedAt: new Date(),
		},
	});
}

export async function markJobFailed(id: string, error: string) {
	return await db.toolJob.update({
		where: { id },
		data: {
			status: "FAILED",
			error,
			completedAt: new Date(),
		},
	});
}

export async function requeueJob(id: string, processAfter?: Date) {
	return await db.toolJob.update({
		where: { id },
		data: {
			status: "PENDING",
			startedAt: processAfter ?? null,
		},
	});
}

export async function getJobsToRetry() {
	// Find failed jobs that haven't exceeded max attempts
	// Use raw query to compare attempts < maxAttempts
	return await db.$queryRaw<
		Array<{
			id: string;
			toolSlug: string;
			status: ToolJobStatus;
			priority: number;
			input: Prisma.JsonValue;
			output: Prisma.JsonValue | null;
			error: string | null;
			userId: string | null;
			sessionId: string | null;
			attempts: number;
			maxAttempts: number;
			startedAt: Date | null;
			completedAt: Date | null;
			expiresAt: Date;
			createdAt: Date;
			updatedAt: Date;
		}>
	>`
		SELECT * FROM "tool_job"
		WHERE status = 'FAILED'
		AND attempts < "maxAttempts"
	`;
}

export async function getStuckJobs(timeoutMinutes = 30) {
	const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

	return await db.toolJob.findMany({
		where: {
			status: "PROCESSING",
			startedAt: {
				lt: cutoff,
			},
		},
	});
}

export async function markStuckJobsAsFailed(timeoutMinutes = 30) {
	const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

	return await db.toolJob.updateMany({
		where: {
			status: "PROCESSING",
			startedAt: {
				lt: cutoff,
			},
		},
		data: {
			status: "FAILED",
			error: "Job timed out",
			completedAt: new Date(),
		},
	});
}

export async function cleanupExpiredJobs() {
	return await db.toolJob.deleteMany({
		where: {
			expiresAt: { lt: new Date() },
			status: { in: ["COMPLETED", "FAILED", "CANCELLED"] },
		},
	});
}

export async function getJobStats(toolSlug?: string) {
	const where = toolSlug ? { toolSlug } : {};

	const [pending, processing, completed, failed, cancelled] =
		await Promise.all([
			db.toolJob.count({ where: { ...where, status: "PENDING" } }),
			db.toolJob.count({ where: { ...where, status: "PROCESSING" } }),
			db.toolJob.count({ where: { ...where, status: "COMPLETED" } }),
			db.toolJob.count({ where: { ...where, status: "FAILED" } }),
			db.toolJob.count({ where: { ...where, status: "CANCELLED" } }),
		]);

	return { pending, processing, completed, failed, cancelled };
}

/**
 * Find a cached completed job for the given tool and input
 * Used for caching expensive operations (e.g., news analysis)
 *
 * @param toolSlug - The tool slug to search for
 * @param input - The job input to match
 * @param maxAgeHours - Maximum age in hours (default: 24)
 * @returns The most recent completed job matching the criteria, or null
 */
export async function findCachedJob(
	toolSlug: string,
	input: Prisma.InputJsonValue,
	maxAgeHours = 24,
) {
	const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

	return await db.toolJob.findFirst({
		where: {
			toolSlug,
			status: "COMPLETED",
			input: {
				equals: input,
			},
			completedAt: {
				gte: cutoff,
			},
		},
		orderBy: {
			completedAt: "desc",
		},
	});
}
