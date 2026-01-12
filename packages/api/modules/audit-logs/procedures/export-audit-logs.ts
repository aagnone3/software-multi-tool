import {
	createAuditLog,
	getAuditLogsForExport,
	zodSchemas,
} from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

const { AuditActionSchema } = zodSchemas;

export const exportAuditLogs = adminProcedure
	.route({
		method: "GET",
		path: "/admin/audit-logs/export",
		tags: ["Administration", "Audit"],
		summary: "Export audit logs as JSON or CSV",
	})
	.input(
		z.object({
			format: z.enum(["json", "csv"]).default("json"),
			userId: z.string().optional(),
			organizationId: z.string().optional(),
			action: AuditActionSchema.optional(),
			resource: z.string().optional(),
			success: z.boolean().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { format, ...filters } = input;

		const logs = await getAuditLogsForExport(filters);

		// Log the export action itself for audit trail
		await createAuditLog({
			userId: context.user.id,
			organizationId: context.session.activeOrganizationId,
			action: "EXPORT",
			resource: "audit_logs",
			sessionId: context.session.id,
			ipAddress: context.session.ipAddress,
			userAgent: context.session.userAgent,
			metadata: {
				format,
				filters,
				recordCount: logs.length,
			},
		});

		if (format === "csv") {
			const headers = [
				"id",
				"createdAt",
				"userId",
				"organizationId",
				"action",
				"resource",
				"resourceId",
				"ipAddress",
				"userAgent",
				"sessionId",
				"success",
				"metadata",
			];

			const csvRows = [
				headers.join(","),
				...logs.map((log) => {
					return [
						log.id,
						log.createdAt.toISOString(),
						log.userId ?? "",
						log.organizationId ?? "",
						log.action,
						log.resource,
						log.resourceId ?? "",
						log.ipAddress ?? "",
						// Escape user agent which may contain commas
						`"${(log.userAgent ?? "").replace(/"/g, '""')}"`,
						log.sessionId ?? "",
						log.success,
						// Escape metadata JSON
						`"${JSON.stringify(log.metadata ?? {}).replace(/"/g, '""')}"`,
					].join(",");
				}),
			];

			return {
				format: "csv" as const,
				data: csvRows.join("\n"),
				filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
			};
		}

		return {
			format: "json" as const,
			data: logs,
			filename: `audit-logs-${new Date().toISOString().split("T")[0]}.json`,
		};
	});
