import { db } from "../client";

/**
 * GDPR Data Export Queries
 *
 * Collects all personal data associated with a user for GDPR Article 20 compliance.
 * Data is returned in a portable format suitable for export.
 */

/**
 * Get complete user profile data
 */
export async function getUserProfileForExport(userId: string) {
	return await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			image: true,
			username: true,
			role: true,
			locale: true,
			twoFactorEnabled: true,
			onboardingComplete: true,
			createdAt: true,
			updatedAt: true,
			// Exclude: banned, banReason, banExpires, paymentsCustomerId (internal only)
		},
	});
}

/**
 * Get user's linked accounts (OAuth providers)
 * Excludes sensitive tokens and secrets
 */
export async function getUserAccountsForExport(userId: string) {
	return await db.account.findMany({
		where: { userId },
		select: {
			id: true,
			providerId: true,
			accountId: true,
			scope: true,
			createdAt: true,
			updatedAt: true,
			// Excluded: accessToken, refreshToken, idToken, password (sensitive)
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Get user's sessions
 * Excludes token (sensitive)
 */
export async function getUserSessionsForExport(userId: string) {
	return await db.session.findMany({
		where: { userId },
		select: {
			id: true,
			ipAddress: true,
			userAgent: true,
			createdAt: true,
			expiresAt: true,
			// Excluded: token (sensitive)
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Get user's organization memberships
 */
export async function getUserOrganizationsForExport(userId: string) {
	return await db.member.findMany({
		where: { userId },
		select: {
			role: true,
			createdAt: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Get user's purchases/subscriptions
 * Excludes customerId (internal payment reference)
 */
export async function getUserPurchasesForExport(userId: string) {
	return await db.purchase.findMany({
		where: { userId },
		select: {
			id: true,
			type: true,
			productId: true,
			status: true,
			organizationId: true,
			createdAt: true,
			updatedAt: true,
			// Excluded: customerId, subscriptionId (internal payment references)
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Get user's AI chat history
 * Returns metadata only, not full message content to avoid excessive size
 */
export async function getUserAiChatsForExport(userId: string) {
	const chats = await db.aiChat.findMany({
		where: { userId },
		select: {
			id: true,
			title: true,
			messages: true,
			organizationId: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: { createdAt: "desc" },
		take: 1000, // Limit to prevent excessive data
	});

	// Transform to include message count instead of full messages
	return chats.map((chat) => ({
		id: chat.id,
		title: chat.title,
		messageCount: Array.isArray(chat.messages)
			? (chat.messages as unknown[]).length
			: 0,
		organizationId: chat.organizationId,
		createdAt: chat.createdAt,
		updatedAt: chat.updatedAt,
	}));
}

/**
 * Get user's tool job history
 * Returns metadata only, not full input/output to avoid excessive size
 */
export async function getUserToolJobsForExport(userId: string) {
	return await db.toolJob.findMany({
		where: { userId },
		select: {
			id: true,
			toolSlug: true,
			status: true,
			createdAt: true,
			completedAt: true,
			// Excluded: input, output, error (potentially large/sensitive)
		},
		orderBy: { createdAt: "desc" },
		take: 1000, // Limit to prevent excessive data
	});
}

/**
 * Get user's audit log entries
 */
export async function getUserAuditLogsForExport(userId: string) {
	return await db.auditLog.findMany({
		where: { userId },
		select: {
			id: true,
			action: true,
			resource: true,
			resourceId: true,
			success: true,
			ipAddress: true,
			createdAt: true,
			// Excluded: metadata, userAgent, sessionId (potentially sensitive)
		},
		orderBy: { createdAt: "desc" },
		take: 10000, // Limit to prevent memory issues
	});
}

/**
 * Collect all user data for GDPR export
 */
export async function collectAllUserDataForExport(userId: string) {
	const [
		profile,
		accounts,
		sessions,
		organizations,
		purchases,
		aiChats,
		toolJobs,
		auditLogs,
	] = await Promise.all([
		getUserProfileForExport(userId),
		getUserAccountsForExport(userId),
		getUserSessionsForExport(userId),
		getUserOrganizationsForExport(userId),
		getUserPurchasesForExport(userId),
		getUserAiChatsForExport(userId),
		getUserToolJobsForExport(userId),
		getUserAuditLogsForExport(userId),
	]);

	return {
		profile,
		accounts,
		sessions,
		organizations,
		purchases,
		aiChats,
		toolJobs,
		auditLogs,
	};
}

/**
 * Check if user has a pending or processing GDPR export request
 */
export async function getActiveGdprExportJob(userId: string) {
	return await db.toolJob.findFirst({
		where: {
			userId,
			toolSlug: "gdpr-exporter",
			status: {
				in: ["PENDING", "PROCESSING"],
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Get the most recent completed GDPR export job for a user
 */
export async function getLatestCompletedGdprExportJob(userId: string) {
	return await db.toolJob.findFirst({
		where: {
			userId,
			toolSlug: "gdpr-exporter",
			status: "COMPLETED",
		},
		orderBy: { completedAt: "desc" },
	});
}

/**
 * Get recent GDPR export jobs for rate limiting check
 * Returns jobs created within the specified hours
 */
export async function getRecentGdprExportJobs(
	userId: string,
	withinHours: number = 24,
) {
	const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);

	return await db.toolJob.findMany({
		where: {
			userId,
			toolSlug: "gdpr-exporter",
			createdAt: {
				gte: cutoff,
			},
		},
		orderBy: { createdAt: "desc" },
	});
}
