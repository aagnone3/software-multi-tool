import { db } from "../client";
import type { AuditAction, Prisma } from "../generated/client";

// Default retention period in days
const DEFAULT_RETENTION_DAYS = 90;

interface CreateAuditLogInput {
	userId?: string | null;
	organizationId?: string | null;
	action: AuditAction;
	resource: string;
	resourceId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	sessionId?: string | null;
	success?: boolean;
	metadata?: Prisma.InputJsonValue;
	retentionDays?: number;
}

export async function createAuditLog({
	userId,
	organizationId,
	action,
	resource,
	resourceId,
	ipAddress,
	userAgent,
	sessionId,
	success = true,
	metadata,
	retentionDays = DEFAULT_RETENTION_DAYS,
}: CreateAuditLogInput) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + retentionDays);

	return await db.auditLog.create({
		data: {
			userId,
			organizationId,
			action,
			resource,
			resourceId,
			ipAddress,
			userAgent,
			sessionId,
			success,
			metadata,
			expiresAt,
		},
	});
}

interface GetAuditLogsInput {
	limit: number;
	offset: number;
	userId?: string;
	organizationId?: string;
	action?: AuditAction;
	resource?: string;
	success?: boolean;
	startDate?: Date;
	endDate?: Date;
	search?: string;
}

export async function getAuditLogs({
	limit,
	offset,
	userId,
	organizationId,
	action,
	resource,
	success,
	startDate,
	endDate,
	search,
}: GetAuditLogsInput) {
	const where: Prisma.AuditLogWhereInput = {};

	if (userId) {
		where.userId = userId;
	}

	if (organizationId) {
		where.organizationId = organizationId;
	}

	if (action) {
		where.action = action;
	}

	if (resource) {
		where.resource = resource;
	}

	if (success !== undefined) {
		where.success = success;
	}

	if (startDate || endDate) {
		where.createdAt = {};
		if (startDate) {
			where.createdAt.gte = startDate;
		}
		if (endDate) {
			where.createdAt.lte = endDate;
		}
	}

	if (search) {
		where.OR = [
			{ resource: { contains: search, mode: "insensitive" } },
			{ resourceId: { contains: search, mode: "insensitive" } },
			{ ipAddress: { contains: search, mode: "insensitive" } },
		];
	}

	return await db.auditLog.findMany({
		where,
		take: limit,
		skip: offset,
		orderBy: { createdAt: "desc" },
	});
}

export async function countAuditLogs({
	userId,
	organizationId,
	action,
	resource,
	success,
	startDate,
	endDate,
	search,
}: Omit<GetAuditLogsInput, "limit" | "offset">) {
	const where: Prisma.AuditLogWhereInput = {};

	if (userId) {
		where.userId = userId;
	}

	if (organizationId) {
		where.organizationId = organizationId;
	}

	if (action) {
		where.action = action;
	}

	if (resource) {
		where.resource = resource;
	}

	if (success !== undefined) {
		where.success = success;
	}

	if (startDate || endDate) {
		where.createdAt = {};
		if (startDate) {
			where.createdAt.gte = startDate;
		}
		if (endDate) {
			where.createdAt.lte = endDate;
		}
	}

	if (search) {
		where.OR = [
			{ resource: { contains: search, mode: "insensitive" } },
			{ resourceId: { contains: search, mode: "insensitive" } },
			{ ipAddress: { contains: search, mode: "insensitive" } },
		];
	}

	return await db.auditLog.count({ where });
}

export async function getAuditLogById(id: string) {
	return await db.auditLog.findUnique({
		where: { id },
	});
}

export async function deleteExpiredAuditLogs() {
	const now = new Date();

	const result = await db.auditLog.deleteMany({
		where: {
			expiresAt: {
				lte: now,
			},
		},
	});

	return result.count;
}

export async function getDistinctResources() {
	const results = await db.auditLog.findMany({
		select: { resource: true },
		distinct: ["resource"],
		orderBy: { resource: "asc" },
	});

	return results.map((r) => r.resource);
}

export async function getAuditLogsForExport({
	userId,
	organizationId,
	action,
	resource,
	success,
	startDate,
	endDate,
}: Omit<GetAuditLogsInput, "limit" | "offset" | "search">) {
	const where: Prisma.AuditLogWhereInput = {};

	if (userId) {
		where.userId = userId;
	}

	if (organizationId) {
		where.organizationId = organizationId;
	}

	if (action) {
		where.action = action;
	}

	if (resource) {
		where.resource = resource;
	}

	if (success !== undefined) {
		where.success = success;
	}

	if (startDate || endDate) {
		where.createdAt = {};
		if (startDate) {
			where.createdAt.gte = startDate;
		}
		if (endDate) {
			where.createdAt.lte = endDate;
		}
	}

	// Limit export to prevent memory issues - can be streamed for larger exports
	return await db.auditLog.findMany({
		where,
		take: 10000,
		orderBy: { createdAt: "desc" },
	});
}
