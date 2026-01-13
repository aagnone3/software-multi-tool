import type { ToolJob } from "@repo/database";
import {
	collectAllUserDataForExport,
	createAuditLog,
	type Prisma,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { createStorageProvider } from "@repo/storage";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type {
	ExportedAccount,
	ExportedAiChat,
	ExportedAuditLog,
	ExportedOrganizationMembership,
	ExportedPurchase,
	ExportedSession,
	ExportedToolJob,
	ExportedUserProfile,
	GdprExporterInput,
	GdprExporterOutput,
	GdprExportPackage,
} from "../types";

// Export file expiration: 24 hours
const EXPORT_EXPIRATION_HOURS = 24;

// Storage configuration from environment
const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? "uploads";

/**
 * Creates the storage provider for GDPR exports
 */
function getStorageProvider() {
	// Check for S3 configuration
	if (
		process.env.S3_ACCESS_KEY_ID &&
		process.env.S3_SECRET_ACCESS_KEY &&
		process.env.S3_ENDPOINT
	) {
		return createStorageProvider({
			type: "s3",
			endpoint: process.env.S3_ENDPOINT,
			region: process.env.S3_REGION ?? "auto",
			accessKeyId: process.env.S3_ACCESS_KEY_ID,
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
			forcePathStyle: true,
		});
	}

	// Fall back to local storage for development
	return createStorageProvider({
		type: "local",
		baseDir:
			process.env.LOCAL_STORAGE_DIR ?? "/tmp/software-multi-tool-uploads",
		baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3500",
		signingSecret: process.env.LOCAL_STORAGE_SECRET ?? "dev-secret",
	});
}

/**
 * Transform raw database data into export format
 */
function transformUserData(
	rawData: Awaited<ReturnType<typeof collectAllUserDataForExport>>,
): GdprExportPackage["categories"] | null {
	if (!rawData.profile) {
		return null;
	}

	// Transform profile
	const profile: ExportedUserProfile = {
		id: rawData.profile.id,
		name: rawData.profile.name,
		email: rawData.profile.email,
		emailVerified: rawData.profile.emailVerified,
		image: rawData.profile.image,
		username: rawData.profile.username,
		role: rawData.profile.role,
		locale: rawData.profile.locale,
		twoFactorEnabled: rawData.profile.twoFactorEnabled,
		onboardingComplete: rawData.profile.onboardingComplete,
		createdAt: rawData.profile.createdAt.toISOString(),
		updatedAt: rawData.profile.updatedAt.toISOString(),
	};

	// Transform accounts
	const accounts: ExportedAccount[] = rawData.accounts.map((account) => ({
		id: account.id,
		providerId: account.providerId,
		accountId: account.accountId,
		scope: account.scope,
		createdAt: account.createdAt.toISOString(),
		updatedAt: account.updatedAt.toISOString(),
	}));

	// Transform sessions
	const sessions: ExportedSession[] = rawData.sessions.map((session) => ({
		id: session.id,
		ipAddress: session.ipAddress,
		userAgent: session.userAgent,
		createdAt: session.createdAt.toISOString(),
		expiresAt: session.expiresAt.toISOString(),
	}));

	// Transform organization memberships
	const organizations: ExportedOrganizationMembership[] =
		rawData.organizations.map((membership) => ({
			organizationId: membership.organization.id,
			organizationName: membership.organization.name,
			organizationSlug: membership.organization.slug,
			role: membership.role,
			joinedAt: membership.createdAt.toISOString(),
		}));

	// Transform purchases
	const purchases: ExportedPurchase[] = rawData.purchases.map((purchase) => ({
		id: purchase.id,
		type: purchase.type,
		productId: purchase.productId,
		status: purchase.status,
		organizationId: purchase.organizationId,
		createdAt: purchase.createdAt.toISOString(),
		updatedAt: purchase.updatedAt.toISOString(),
	}));

	// Transform AI chats
	const aiChats: ExportedAiChat[] = rawData.aiChats.map((chat) => ({
		id: chat.id,
		title: chat.title,
		messageCount: chat.messageCount,
		organizationId: chat.organizationId,
		createdAt: chat.createdAt.toISOString(),
		updatedAt: chat.updatedAt.toISOString(),
	}));

	// Transform tool jobs
	const toolJobs: ExportedToolJob[] = rawData.toolJobs.map((job) => ({
		id: job.id,
		toolSlug: job.toolSlug,
		status: job.status,
		createdAt: job.createdAt.toISOString(),
		completedAt: job.completedAt?.toISOString() ?? null,
	}));

	// Transform audit logs
	const auditLogs: ExportedAuditLog[] = rawData.auditLogs.map((log) => ({
		id: log.id,
		action: log.action,
		resource: log.resource,
		resourceId: log.resourceId,
		success: log.success,
		ipAddress: log.ipAddress,
		createdAt: log.createdAt.toISOString(),
	}));

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
 * Process a GDPR data export job
 *
 * This processor:
 * 1. Collects all user data from the database
 * 2. Transforms it into a portable format
 * 3. Uploads to storage as JSON
 * 4. Generates a signed download URL (24hr expiry)
 * 5. Sends an email notification to the user
 * 6. Creates an audit log entry
 */
export async function processGdprExportJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as GdprExporterInput;
	const { userId, userEmail, format } = input;

	logger.info(`[GdprExporter] Starting export for user: ${userId}`, {
		format,
		jobId: job.id,
	});

	try {
		// Step 1: Collect all user data
		logger.debug(`[GdprExporter] Collecting user data for: ${userId}`);
		const rawData = await collectAllUserDataForExport(userId);

		if (!rawData.profile) {
			return {
				success: false,
				error: "User not found",
			};
		}

		// Step 2: Transform data into export format
		const categories = transformUserData(rawData);
		if (!categories) {
			return {
				success: false,
				error: "Failed to transform user data",
			};
		}

		// Step 3: Build the export package
		const exportedAt = new Date().toISOString();
		const exportPackage: GdprExportPackage = {
			exportedAt,
			exportedFor: {
				userId,
				email: userEmail,
			},
			format,
			dataRetentionNotice:
				"This export contains all personal data associated with your account as required by GDPR Article 20. Data categories include: profile information, linked accounts, sessions, organization memberships, purchases, AI chat history (metadata only), tool usage history, and audit logs. Some sensitive fields (tokens, passwords) are excluded for security. This download link expires in 24 hours.",
			categories,
		};

		// Step 4: Upload to storage
		const storage = getStorageProvider();
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const storageKey = `gdpr-exports/${userId}/user-data-export-${timestamp}.json`;

		logger.debug(`[GdprExporter] Uploading export to: ${storageKey}`);

		const exportJson = JSON.stringify(exportPackage, null, 2);
		const buffer = Buffer.from(exportJson, "utf-8");

		await storage.upload(storageKey, buffer, {
			bucket: STORAGE_BUCKET,
			contentType: "application/json",
			metadata: {
				userId,
				exportedAt,
				format,
			},
		});

		// Step 5: Generate signed download URL (24 hour expiry)
		const expiresAt = new Date(
			Date.now() + EXPORT_EXPIRATION_HOURS * 60 * 60 * 1000,
		);

		const downloadUrl = await storage.getSignedDownloadUrl(storageKey, {
			bucket: STORAGE_BUCKET,
			expiresIn: EXPORT_EXPIRATION_HOURS * 60 * 60, // seconds
		});

		logger.info(`[GdprExporter] Export completed for user: ${userId}`, {
			storageKey,
			expiresAt: expiresAt.toISOString(),
		});

		// Step 6: Count total records
		const totalRecords =
			1 + // profile
			categories.accounts.length +
			categories.sessions.length +
			categories.organizations.length +
			categories.purchases.length +
			categories.aiChats.length +
			categories.toolJobs.length +
			categories.auditLogs.length;

		// Step 7: Create audit log entry
		await createAuditLog({
			userId,
			action: "EXPORT",
			resource: "user-data",
			resourceId: job.id,
			success: true,
			metadata: {
				format,
				totalRecords,
				categories: Object.keys(categories),
			},
		});

		// Step 8: Send email notification
		try {
			await sendEmail({
				to: userEmail,
				subject: "Your data export is ready",
				html: `
					<h2>Your Data Export is Ready</h2>
					<p>Hello,</p>
					<p>Your GDPR data export has been generated and is ready for download.</p>
					<p><strong>Important:</strong> This download link will expire in 24 hours.</p>
					<p>Your export includes:</p>
					<ul>
						<li>Profile information</li>
						<li>Linked accounts (${categories.accounts.length})</li>
						<li>Sessions (${categories.sessions.length})</li>
						<li>Organization memberships (${categories.organizations.length})</li>
						<li>Purchases (${categories.purchases.length})</li>
						<li>AI chat history (${categories.aiChats.length} conversations)</li>
						<li>Tool usage history (${categories.toolJobs.length} jobs)</li>
						<li>Audit logs (${categories.auditLogs.length} entries)</li>
					</ul>
					<p>Total records: ${totalRecords}</p>
					<p>You can download your data from your account settings or use the download link that was provided when you requested the export.</p>
					<p>Best regards,<br>The Team</p>
				`,
				text: `Your Data Export is Ready\n\nHello,\n\nYour GDPR data export has been generated and is ready for download.\n\nImportant: This download link will expire in 24 hours.\n\nTotal records exported: ${totalRecords}\n\nYou can download your data from your account settings.\n\nBest regards,\nThe Team`,
			});
		} catch (emailError) {
			// Log but don't fail the job if email fails
			logger.error("[GdprExporter] Failed to send notification email", {
				error:
					emailError instanceof Error
						? emailError.message
						: String(emailError),
				userId,
			});
		}

		// Step 9: Return success with output
		const output: GdprExporterOutput = {
			downloadUrl,
			expiresAt: expiresAt.toISOString(),
			format,
			categories: Object.keys(categories),
			totalRecords,
			generatedAt: exportedAt,
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to generate data export";

		logger.error(`[GdprExporter] Export failed for user: ${userId}`, {
			error: errorMessage,
			jobId: job.id,
		});

		// Log the failure in audit log
		try {
			await createAuditLog({
				userId,
				action: "EXPORT",
				resource: "user-data",
				resourceId: job.id,
				success: false,
				metadata: {
					error: errorMessage,
				},
			});
		} catch {
			// Ignore audit log errors
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}
