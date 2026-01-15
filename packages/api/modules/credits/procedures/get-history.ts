import { ORPCError } from "@orpc/server";
import type { CreditTransactionType } from "@repo/database";
import { getTransactionHistory } from "../../../lib/credits/queries";
import { protectedProcedure } from "../../../orpc/procedures";
import { historyQuerySchema, historyResponseSchema } from "../schemas";

export const getHistory = protectedProcedure
	.route({
		method: "GET",
		path: "/credits/history",
		tags: ["Credits"],
		summary: "Get credit transaction history",
		description:
			"Get paginated credit transaction history for the active organization with optional filtering",
	})
	.input(historyQuerySchema)
	.output(historyResponseSchema)
	.handler(async ({ input, context }) => {
		const organizationId = context.session.activeOrganizationId;

		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "No active organization",
			});
		}

		const { limit, offset, toolSlug, type, startDate, endDate } = input;

		const result = await getTransactionHistory({
			organizationId,
			limit,
			offset,
			toolSlug,
			type: type as CreditTransactionType | undefined,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
		});

		const transactions = result.transactions.map((tx) => ({
			id: tx.id,
			amount: tx.amount,
			type: tx.type,
			toolSlug: tx.toolSlug,
			jobId: tx.jobId,
			description: tx.description,
			createdAt: tx.createdAt.toISOString(),
		}));

		return {
			transactions,
			pagination: {
				total: result.total,
				limit,
				offset,
				hasMore: offset + transactions.length < result.total,
			},
		};
	});
