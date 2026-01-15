import type { Prisma } from "@prisma/client";
import { db } from "../client";

interface CreateNotificationInput {
	userId: string;
	type: string; // "info" | "success" | "warning" | "error"
	category: string; // "billing" | "security" | "team" | "system"
	title: string;
	body: string;
	actionUrl?: string | null;
}

export async function createNotification({
	userId,
	type,
	category,
	title,
	body,
	actionUrl,
}: CreateNotificationInput) {
	return await db.notification.create({
		data: {
			userId,
			type,
			category,
			title,
			body,
			actionUrl,
		},
	});
}

interface GetNotificationsInput {
	userId: string;
	limit: number;
	offset: number;
	unreadOnly?: boolean;
	category?: string;
}

export async function getNotifications({
	userId,
	limit,
	offset,
	unreadOnly,
	category,
}: GetNotificationsInput) {
	const where: Prisma.NotificationWhereInput = { userId };

	if (unreadOnly) {
		where.read = false;
	}

	if (category) {
		where.category = category;
	}

	return await db.notification.findMany({
		where,
		take: limit,
		skip: offset,
		orderBy: { createdAt: "desc" },
	});
}

export async function countNotifications({
	userId,
	unreadOnly,
	category,
}: Omit<GetNotificationsInput, "limit" | "offset">) {
	const where: Prisma.NotificationWhereInput = { userId };

	if (unreadOnly) {
		where.read = false;
	}

	if (category) {
		where.category = category;
	}

	return await db.notification.count({ where });
}

export async function getUnreadCount(userId: string) {
	return await db.notification.count({
		where: {
			userId,
			read: false,
		},
	});
}

export async function markAsRead(notificationId: string, userId: string) {
	return await db.notification.updateMany({
		where: {
			id: notificationId,
			userId, // Ensure user owns the notification
		},
		data: {
			read: true,
			readAt: new Date(),
		},
	});
}

export async function markAllAsRead(userId: string) {
	return await db.notification.updateMany({
		where: {
			userId,
			read: false,
		},
		data: {
			read: true,
			readAt: new Date(),
		},
	});
}

export async function deleteNotification(
	notificationId: string,
	userId: string,
) {
	return await db.notification.deleteMany({
		where: {
			id: notificationId,
			userId, // Ensure user owns the notification
		},
	});
}

export async function getNotificationById(
	notificationId: string,
	userId: string,
) {
	return await db.notification.findFirst({
		where: {
			id: notificationId,
			userId,
		},
	});
}
