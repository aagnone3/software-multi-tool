import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	notificationCreate: vi.fn(),
	notificationFindMany: vi.fn(),
	notificationFindFirst: vi.fn(),
	notificationCount: vi.fn(),
	notificationUpdateMany: vi.fn(),
	notificationDeleteMany: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		notification: {
			create: mocks.notificationCreate,
			findMany: mocks.notificationFindMany,
			findFirst: mocks.notificationFindFirst,
			count: mocks.notificationCount,
			updateMany: mocks.notificationUpdateMany,
			deleteMany: mocks.notificationDeleteMany,
		},
	},
}));

import {
	countNotifications,
	createNotification,
	deleteNotification,
	getNotificationById,
	getNotifications,
	getUnreadCount,
	markAllAsRead,
	markAsRead,
} from "./notifications";

describe("notifications queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("createNotification", () => {
		it("creates a notification with all fields", async () => {
			const mockNotification = {
				id: "notif-1",
				userId: "user-1",
				type: "info",
				category: "billing",
				title: "Test Title",
				body: "Test Body",
				actionUrl: "https://example.com",
				read: false,
				readAt: null,
				createdAt: new Date(),
			};
			mocks.notificationCreate.mockResolvedValueOnce(mockNotification);

			const result = await createNotification({
				userId: "user-1",
				type: "info",
				category: "billing",
				title: "Test Title",
				body: "Test Body",
				actionUrl: "https://example.com",
			});

			expect(result).toEqual(mockNotification);
			expect(mocks.notificationCreate).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					type: "info",
					category: "billing",
					title: "Test Title",
					body: "Test Body",
					actionUrl: "https://example.com",
				},
			});
		});

		it("creates a notification without actionUrl", async () => {
			mocks.notificationCreate.mockResolvedValueOnce({
				id: "notif-1",
				actionUrl: null,
			});

			await createNotification({
				userId: "user-1",
				type: "success",
				category: "system",
				title: "Test",
				body: "Test body",
			});

			expect(mocks.notificationCreate).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					type: "success",
					category: "system",
					title: "Test",
					body: "Test body",
					actionUrl: undefined,
				},
			});
		});
	});

	describe("getNotifications", () => {
		it("returns paginated notifications for a user", async () => {
			const mockNotifications = [
				{ id: "notif-1", title: "First" },
				{ id: "notif-2", title: "Second" },
			];
			mocks.notificationFindMany.mockResolvedValueOnce(mockNotifications);

			const result = await getNotifications({
				userId: "user-1",
				limit: 10,
				offset: 0,
			});

			expect(result).toEqual(mockNotifications);
			expect(mocks.notificationFindMany).toHaveBeenCalledWith({
				where: { userId: "user-1" },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by unreadOnly", async () => {
			mocks.notificationFindMany.mockResolvedValueOnce([]);

			await getNotifications({
				userId: "user-1",
				limit: 10,
				offset: 0,
				unreadOnly: true,
			});

			expect(mocks.notificationFindMany).toHaveBeenCalledWith({
				where: { userId: "user-1", read: false },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("filters by category", async () => {
			mocks.notificationFindMany.mockResolvedValueOnce([]);

			await getNotifications({
				userId: "user-1",
				limit: 10,
				offset: 0,
				category: "billing",
			});

			expect(mocks.notificationFindMany).toHaveBeenCalledWith({
				where: { userId: "user-1", category: "billing" },
				take: 10,
				skip: 0,
				orderBy: { createdAt: "desc" },
			});
		});

		it("combines unreadOnly and category filters", async () => {
			mocks.notificationFindMany.mockResolvedValueOnce([]);

			await getNotifications({
				userId: "user-1",
				limit: 25,
				offset: 10,
				unreadOnly: true,
				category: "security",
			});

			expect(mocks.notificationFindMany).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					read: false,
					category: "security",
				},
				take: 25,
				skip: 10,
				orderBy: { createdAt: "desc" },
			});
		});
	});

	describe("countNotifications", () => {
		it("counts notifications for a user", async () => {
			mocks.notificationCount.mockResolvedValueOnce(42);

			const result = await countNotifications({
				userId: "user-1",
			});

			expect(result).toBe(42);
			expect(mocks.notificationCount).toHaveBeenCalledWith({
				where: { userId: "user-1" },
			});
		});

		it("counts unread notifications only", async () => {
			mocks.notificationCount.mockResolvedValueOnce(5);

			const result = await countNotifications({
				userId: "user-1",
				unreadOnly: true,
			});

			expect(result).toBe(5);
			expect(mocks.notificationCount).toHaveBeenCalledWith({
				where: { userId: "user-1", read: false },
			});
		});

		it("counts notifications by category", async () => {
			mocks.notificationCount.mockResolvedValueOnce(10);

			const result = await countNotifications({
				userId: "user-1",
				category: "team",
			});

			expect(result).toBe(10);
			expect(mocks.notificationCount).toHaveBeenCalledWith({
				where: { userId: "user-1", category: "team" },
			});
		});
	});

	describe("getUnreadCount", () => {
		it("returns count of unread notifications", async () => {
			mocks.notificationCount.mockResolvedValueOnce(7);

			const result = await getUnreadCount("user-1");

			expect(result).toBe(7);
			expect(mocks.notificationCount).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					read: false,
				},
			});
		});
	});

	describe("markAsRead", () => {
		it("marks a notification as read", async () => {
			mocks.notificationUpdateMany.mockResolvedValueOnce({ count: 1 });

			const now = Date.now();
			vi.useFakeTimers();
			vi.setSystemTime(now);

			const result = await markAsRead("notif-1", "user-1");

			expect(result).toEqual({ count: 1 });
			expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
				where: {
					id: "notif-1",
					userId: "user-1",
				},
				data: {
					read: true,
					readAt: new Date(now),
				},
			});

			vi.useRealTimers();
		});
	});

	describe("markAllAsRead", () => {
		it("marks all unread notifications as read for a user", async () => {
			mocks.notificationUpdateMany.mockResolvedValueOnce({ count: 15 });

			const now = Date.now();
			vi.useFakeTimers();
			vi.setSystemTime(now);

			const result = await markAllAsRead("user-1");

			expect(result).toEqual({ count: 15 });
			expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					read: false,
				},
				data: {
					read: true,
					readAt: new Date(now),
				},
			});

			vi.useRealTimers();
		});
	});

	describe("deleteNotification", () => {
		it("deletes a notification owned by the user", async () => {
			mocks.notificationDeleteMany.mockResolvedValueOnce({ count: 1 });

			const result = await deleteNotification("notif-1", "user-1");

			expect(result).toEqual({ count: 1 });
			expect(mocks.notificationDeleteMany).toHaveBeenCalledWith({
				where: {
					id: "notif-1",
					userId: "user-1",
				},
			});
		});

		it("returns count 0 if notification not owned by user", async () => {
			mocks.notificationDeleteMany.mockResolvedValueOnce({ count: 0 });

			const result = await deleteNotification("notif-1", "other-user");

			expect(result).toEqual({ count: 0 });
		});
	});

	describe("getNotificationById", () => {
		it("returns a notification owned by the user", async () => {
			const mockNotification = {
				id: "notif-1",
				userId: "user-1",
				title: "Test",
			};
			mocks.notificationFindFirst.mockResolvedValueOnce(mockNotification);

			const result = await getNotificationById("notif-1", "user-1");

			expect(result).toEqual(mockNotification);
			expect(mocks.notificationFindFirst).toHaveBeenCalledWith({
				where: {
					id: "notif-1",
					userId: "user-1",
				},
			});
		});

		it("returns null if notification not found", async () => {
			mocks.notificationFindFirst.mockResolvedValueOnce(null);

			const result = await getNotificationById("notif-1", "user-1");

			expect(result).toBeNull();
		});
	});
});
