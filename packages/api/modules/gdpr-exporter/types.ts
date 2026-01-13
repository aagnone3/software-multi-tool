import { z } from "zod";

// Tool slug for the GDPR exporter job
export const GDPR_EXPORTER_TOOL_SLUG = "gdpr-exporter";

// Export format options
export const ExportFormat = z.enum(["json"]);
export type ExportFormat = z.infer<typeof ExportFormat>;

// Input schema for requesting a data export
export const GdprExportRequestSchema = z.object({
	format: ExportFormat.default("json"),
});

export type GdprExportRequest = z.infer<typeof GdprExportRequestSchema>;

// Job input stored in ToolJob.input
export interface GdprExporterInput {
	userId: string;
	userEmail: string;
	format: ExportFormat;
	requestedAt: string; // ISO date string
}

// Output stored in ToolJob.output
export interface GdprExporterOutput {
	downloadUrl: string;
	expiresAt: string; // ISO date string - 24 hours from generation
	format: ExportFormat;
	categories: string[];
	totalRecords: number;
	generatedAt: string; // ISO date string
}

// Exported data structure for each category
export interface ExportedUserProfile {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	username: string | null;
	role: string | null;
	locale: string | null;
	twoFactorEnabled: boolean | null;
	onboardingComplete: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ExportedAccount {
	id: string;
	providerId: string;
	accountId: string;
	scope: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ExportedSession {
	id: string;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
	expiresAt: string;
}

export interface ExportedOrganizationMembership {
	organizationId: string;
	organizationName: string;
	organizationSlug: string | null;
	role: string;
	joinedAt: string;
}

export interface ExportedPurchase {
	id: string;
	type: string;
	productId: string;
	status: string | null;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ExportedAiChat {
	id: string;
	title: string | null;
	messageCount: number;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ExportedToolJob {
	id: string;
	toolSlug: string;
	status: string;
	createdAt: string;
	completedAt: string | null;
}

export interface ExportedAuditLog {
	id: string;
	action: string;
	resource: string;
	resourceId: string | null;
	success: boolean;
	ipAddress: string | null;
	createdAt: string;
}

// Complete export package
export interface GdprExportPackage {
	exportedAt: string;
	exportedFor: {
		userId: string;
		email: string;
	};
	format: ExportFormat;
	dataRetentionNotice: string;
	categories: {
		profile: ExportedUserProfile;
		accounts: ExportedAccount[];
		sessions: ExportedSession[];
		organizations: ExportedOrganizationMembership[];
		purchases: ExportedPurchase[];
		aiChats: ExportedAiChat[];
		toolJobs: ExportedToolJob[];
		auditLogs: ExportedAuditLog[];
	};
}
