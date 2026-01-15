import { ORPCError } from "@orpc/server";
import { getUsageStats } from "../../../lib/credits/queries";
import { protectedProcedure } from "../../../orpc/procedures";
import { usageStatsQuerySchema, usageStatsResponseSchema } from "../schemas";

export const getUsageStatsEndpoint = protectedProcedure
	.route({
		method: "GET",
		path: "/credits/usage-stats",
		tags: ["Credits"],
		summary: "Get credit usage statistics",
		description:
			"Get aggregated credit usage statistics for the active organization, grouped by tool and time period",
	})
	.input(usageStatsQuerySchema)
	.output(usageStatsResponseSchema)
	.handler(async ({ input, context }) => {
		const organizationId = context.session.activeOrganizationId;

		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No active organization",
			});
		}

		const { startDate, endDate } = input;

		const stats = await getUsageStats({
			organizationId,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
		});

		return {
			totalUsed: stats.totalUsed,
			totalOverage: stats.totalOverage,
			byTool: stats.byTool,
			byPeriod: stats.byDay,
		};
	});
