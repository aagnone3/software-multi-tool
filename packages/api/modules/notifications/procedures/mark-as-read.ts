import { ORPCError } from "@orpc/server";
import { getNotificationById, markAllAsRead, markAsRead } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const markNotificationAsRead = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/{id}/read",
		tags: ["Notifications"],
		summary: "Mark a single notification as read",
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

		await markAsRead(input.id, userId);

		return { success: true };
	});

export const markAllNotificationsAsRead = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/read-all",
		tags: ["Notifications"],
		summary: "Mark all notifications as read",
	})
	.handler(async ({ context }) => {
		const result = await markAllAsRead(context.user.id);

		return { success: true, count: result.count };
	});
