import { ORPCError } from "@orpc/server";
import { deleteNotification, getNotificationById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteNotificationProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/notifications/{id}",
		tags: ["Notifications"],
		summary: "Delete a notification",
	})
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const userId = context.user.id;

		// Check if notification exists and belongs to user
		const notification = await getNotificationById(input.id, userId);
		if (!notification) {
			throw new ORPCError("NOT_FOUND", {
				message: "Notification not found",
			});
		}

		await deleteNotification(input.id, userId);

		return { success: true };
	});
