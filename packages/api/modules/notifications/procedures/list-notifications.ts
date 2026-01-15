import {
	countNotifications,
	getNotifications,
	getUnreadCount,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listNotifications = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications",
		tags: ["Notifications"],
		summary: "List notifications for current user",
	})
	.input(
		z.object({
			limit: z.number().min(1).max(100).default(25),
			offset: z.number().min(0).default(0),
			unreadOnly: z.boolean().optional(),
			category: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const userId = context.user.id;
		const { limit, offset, unreadOnly, category } = input;

		const [notifications, total, unreadCount] = await Promise.all([
			getNotifications({
				userId,
				limit,
				offset,
				unreadOnly,
				category,
			}),
			countNotifications({
				userId,
				unreadOnly,
				category,
			}),
			getUnreadCount(userId),
		]);

		return { notifications, total, unreadCount };
	});

export const getNotificationUnreadCount = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/unread-count",
		tags: ["Notifications"],
		summary: "Get unread notification count for current user",
	})
	.handler(async ({ context }) => {
		const unreadCount = await getUnreadCount(context.user.id);
		return { unreadCount };
	});
