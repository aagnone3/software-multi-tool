import {
	countAuditLogs,
	getAuditLogs,
	getDistinctResources,
} from "@repo/database";
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

export const listAuditLogs = adminProcedure
	.route({
		method: "GET",
		path: "/admin/audit-logs",
		tags: ["Administration", "Audit"],
		summary: "List audit logs",
	})
	.input(
		z.object({
			limit: z.number().min(1).max(100).default(25),
			offset: z.number().min(0).default(0),
			userId: z.string().optional(),
			organizationId: z.string().optional(),
			action: AuditActionEnum.optional(),
			resource: z.string().optional(),
			success: z.boolean().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
			search: z.string().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const { limit, offset, ...filters } = input;

		const [logs, total] = await Promise.all([
			getAuditLogs({
				limit,
				offset,
				...filters,
			}),
			countAuditLogs(filters),
		]);

		return { logs, total };
	});

export const getAuditLogFilters = adminProcedure
	.route({
		method: "GET",
		path: "/admin/audit-logs/filters",
		tags: ["Administration", "Audit"],
		summary: "Get available filter options for audit logs",
	})
	.handler(async () => {
		const resources = await getDistinctResources();

		const actions = [
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
		] as const;

		return {
			actions,
			resources,
		};
	});
