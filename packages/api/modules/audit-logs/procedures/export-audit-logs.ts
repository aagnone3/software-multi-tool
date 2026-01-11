import { getAuditLogsForExport } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

const AuditActionEnum = z.enum([
	"CREATE",
	"READ",
	"UPDATE",
	"DELETE",
	"LOGIN",
	"LOGOUT",
	"PASSWORD_CHANGE",
	"MFA_SETUP",
	"MFA_DISABLE",
	"IMPERSONATE",
	"INVITE",
	"EXPORT",
	"SUBSCRIPTION_CHANGE",
	"PAYMENT",
]);

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
			action: AuditActionEnum.optional(),
			resource: z.string().optional(),
			success: z.boolean().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const { format, ...filters } = input;

		const logs = await getAuditLogsForExport(filters);

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
