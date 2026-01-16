import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationsRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getNotificationsMock = vi.hoisted(() => vi.fn());
const countNotificationsMock = vi.hoisted(() => vi.fn());
const getUnreadCountMock = vi.hoisted(() => vi.fn());
const getNotificationByIdMock = vi.hoisted(() => vi.fn());
const markAsReadMock = vi.hoisted(() => vi.fn());
const markAllAsReadMock = vi.hoisted(() => vi.fn());
const deleteNotificationMock = vi.hoisted(() => vi.fn());
const getNotificationPreferencesMock = vi.hoisted(() => vi.fn());
const updateNotificationPreferencesMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getNotifications: getNotificationsMock,
	countNotifications: countNotificationsMock,
	getUnreadCount: getUnreadCountMock,
	getNotificationById: getNotificationByIdMock,
	markAsRead: markAsReadMock,
	markAllAsRead: markAllAsReadMock,
	deleteNotification: deleteNotificationMock,
	getNotificationPreferences: getNotificationPreferencesMock,
	updateNotificationPreferences: updateNotificationPreferencesMock,
}));

describe("Notifications Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("notifications.list", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.list, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("lists notifications with default pagination", async () => {
			const mockNotifications = [
				{
					id: "notif-1",
					title: "Test 1",
					body: "Body 1",
					type: "info",
					category: "system",
					read: false,
					createdAt: new Date(),
				},
				{
					id: "notif-2",
					title: "Test 2",
					body: "Body 2",
					type: "success",
					category: "billing",
					read: true,
					createdAt: new Date(),
				},
			];
			getNotificationsMock.mockResolvedValue(mockNotifications);
			countNotificationsMock.mockResolvedValue(50);
			getUnreadCountMock.mockResolvedValue(10);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({
				notifications: mockNotifications,
				total: 50,
				unreadCount: 10,
			});
			expect(getNotificationsMock).toHaveBeenCalledWith({
				userId: "user-123",
				limit: 25,
				offset: 0,
				unreadOnly: undefined,
				category: undefined,
			});
		});

		it("lists notifications with custom pagination", async () => {
			getNotificationsMock.mockResolvedValue([]);
			countNotificationsMock.mockResolvedValue(100);
			getUnreadCountMock.mockResolvedValue(5);

			const client = createClient();
			const result = await client({ limit: 50, offset: 25 });

			expect(result).toEqual({
				notifications: [],
				total: 100,
				unreadCount: 5,
			});
			expect(getNotificationsMock).toHaveBeenCalledWith({
				userId: "user-123",
				limit: 50,
				offset: 25,
				unreadOnly: undefined,
				category: undefined,
			});
		});

		it("lists only unread notifications", async () => {
			getNotificationsMock.mockResolvedValue([]);
			countNotificationsMock.mockResolvedValue(10);
			getUnreadCountMock.mockResolvedValue(10);

			const client = createClient();
			await client({ unreadOnly: true });

			expect(getNotificationsMock).toHaveBeenCalledWith({
				userId: "user-123",
				limit: 25,
				offset: 0,
				unreadOnly: true,
				category: undefined,
			});
			expect(countNotificationsMock).toHaveBeenCalledWith({
				userId: "user-123",
				unreadOnly: true,
				category: undefined,
			});
		});

		it("lists notifications filtered by category", async () => {
			getNotificationsMock.mockResolvedValue([]);
			countNotificationsMock.mockResolvedValue(5);
			getUnreadCountMock.mockResolvedValue(2);

			const client = createClient();
			await client({ category: "billing" });

			expect(getNotificationsMock).toHaveBeenCalledWith({
				userId: "user-123",
				limit: 25,
				offset: 0,
				unreadOnly: undefined,
				category: "billing",
			});
		});

		it("enforces max limit of 100", async () => {
			const client = createClient();

			await expect(client({ limit: 150 })).rejects.toThrow();
		});

		it("enforces min limit of 1", async () => {
			const client = createClient();

			await expect(client({ limit: 0 })).rejects.toThrow();
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(notificationsRouter.list, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.unreadCount", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.unreadCount, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("returns unread count", async () => {
			getUnreadCountMock.mockResolvedValue(7);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ unreadCount: 7 });
			expect(getUnreadCountMock).toHaveBeenCalledWith("user-123");
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				notificationsRouter.unreadCount,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.markAsRead", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.markAsRead, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("marks a notification as read", async () => {
			getNotificationByIdMock.mockResolvedValue({
				id: "notif-1",
				userId: "user-123",
			});
			markAsReadMock.mockResolvedValue({ count: 1 });

			const client = createClient();
			const result = await client({ id: "notif-1" });

			expect(result).toEqual({ success: true });
			expect(getNotificationByIdMock).toHaveBeenCalledWith(
				"notif-1",
				"user-123",
			);
			expect(markAsReadMock).toHaveBeenCalledWith("notif-1", "user-123");
		});

		it("throws NOT_FOUND when notification does not exist", async () => {
			getNotificationByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ id: "notif-999" })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				notificationsRouter.markAsRead,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(client({ id: "notif-1" })).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.markAllAsRead", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.markAllAsRead, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("marks all notifications as read", async () => {
			markAllAsReadMock.mockResolvedValue({ count: 15 });

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ success: true, count: 15 });
			expect(markAllAsReadMock).toHaveBeenCalledWith("user-123");
		});

		it("returns count 0 when no unread notifications", async () => {
			markAllAsReadMock.mockResolvedValue({ count: 0 });

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ success: true, count: 0 });
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				notificationsRouter.markAllAsRead,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.delete", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.delete, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("deletes a notification", async () => {
			getNotificationByIdMock.mockResolvedValue({
				id: "notif-1",
				userId: "user-123",
			});
			deleteNotificationMock.mockResolvedValue({ count: 1 });

			const client = createClient();
			const result = await client({ id: "notif-1" });

			expect(result).toEqual({ success: true });
			expect(getNotificationByIdMock).toHaveBeenCalledWith(
				"notif-1",
				"user-123",
			);
			expect(deleteNotificationMock).toHaveBeenCalledWith(
				"notif-1",
				"user-123",
			);
		});

		it("throws NOT_FOUND when notification does not exist", async () => {
			getNotificationByIdMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({ id: "notif-999" })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(notificationsRouter.delete, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client({ id: "notif-1" })).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.getPreferences", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(notificationsRouter.getPreferences, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("returns user preferences", async () => {
			const mockPreferences = {
				billing: { inApp: true, email: true },
				security: { inApp: true, email: true },
				team: { inApp: true, email: false },
				system: { inApp: true, email: false },
			};
			getNotificationPreferencesMock.mockResolvedValue(mockPreferences);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ preferences: mockPreferences });
			expect(getNotificationPreferencesMock).toHaveBeenCalledWith(
				"user-123",
			);
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				notificationsRouter.getPreferences,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(client({})).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});

	describe("notifications.updatePreferences", () => {
		const createClient = () => {
			getSessionMock.mockResolvedValue({
				user: { id: "user-123", role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(
				notificationsRouter.updatePreferences,
				{
					context: {
						headers: new Headers(),
					},
				},
			);
		};

		it("updates a single category preference", async () => {
			const mockUpdatedPreferences = {
				billing: { inApp: false, email: true },
				security: { inApp: true, email: true },
				team: { inApp: true, email: true },
				system: { inApp: true, email: false },
			};
			updateNotificationPreferencesMock.mockResolvedValue(
				mockUpdatedPreferences,
			);

			const client = createClient();
			const result = await client({
				billing: { inApp: false, email: true },
			});

			expect(result).toEqual({ preferences: mockUpdatedPreferences });
			expect(updateNotificationPreferencesMock).toHaveBeenCalledWith(
				"user-123",
				{ billing: { inApp: false, email: true } },
			);
		});

		it("updates multiple category preferences", async () => {
			const mockUpdatedPreferences = {
				billing: { inApp: false, email: false },
				security: { inApp: true, email: false },
				team: { inApp: true, email: true },
				system: { inApp: true, email: false },
			};
			updateNotificationPreferencesMock.mockResolvedValue(
				mockUpdatedPreferences,
			);

			const client = createClient();
			const result = await client({
				billing: { inApp: false, email: false },
				security: { inApp: true, email: false },
			});

			expect(result).toEqual({ preferences: mockUpdatedPreferences });
			expect(updateNotificationPreferencesMock).toHaveBeenCalledWith(
				"user-123",
				{
					billing: { inApp: false, email: false },
					security: { inApp: true, email: false },
				},
			);
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				notificationsRouter.updatePreferences,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(
				client({ billing: { inApp: true, email: true } }),
			).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});

		it("validates input schema - requires boolean values", async () => {
			const client = createClient();

			await expect(
				client({
					billing: { inApp: "yes", email: true } as any,
				}),
			).rejects.toThrow();
		});
	});
});
