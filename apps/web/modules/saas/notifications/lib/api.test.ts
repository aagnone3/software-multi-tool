import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the oRPC client before importing the hooks
vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		notifications: {
			list: vi.fn(),
			unreadCount: vi.fn(),
			markAsRead: vi.fn(),
			markAllAsRead: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

// Import after mocking
import { orpcClient } from "@shared/lib/orpc-client";
import {
	notificationsQueryKey,
	notificationsUnreadCountQueryKey,
	useDeleteNotificationMutation,
	useMarkAllNotificationsAsReadMutation,
	useMarkNotificationAsReadMutation,
	useNotificationsQuery,
	useNotificationsUnreadCountQuery,
} from "./api";

// Get typed references to the mocked functions
const mockedNotifications = vi.mocked(orpcClient.notifications);

describe("Notifications API hooks", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
				mutations: {
					retry: false,
				},
			},
		});
	});

	const createWrapper = () => {
		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	describe("useNotificationsQuery", () => {
		it("fetches notifications with default options", async () => {
			const mockData = {
				notifications: [
					{
						id: "1",
						title: "Test",
						body: "Body",
						type: "info",
						read: false,
						createdAt: new Date(),
						userId: "user-1",
						category: "system",
						actionUrl: null,
						readAt: null,
					},
				],
				total: 1,
				unreadCount: 1,
			};
			mockedNotifications.list.mockResolvedValueOnce(mockData);

			const { result } = renderHook(() => useNotificationsQuery(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockedNotifications.list).toHaveBeenCalledWith({
				limit: 20,
				offset: 0,
				unreadOnly: undefined,
				category: undefined,
			});
			expect(result.current.data).toEqual(mockData);
		});

		it("fetches notifications with custom options", async () => {
			mockedNotifications.list.mockResolvedValueOnce({
				notifications: [],
				total: 0,
				unreadCount: 0,
			});

			const { result } = renderHook(
				() =>
					useNotificationsQuery({
						limit: 10,
						offset: 5,
						unreadOnly: true,
						category: "billing",
					}),
				{
					wrapper: createWrapper(),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockedNotifications.list).toHaveBeenCalledWith({
				limit: 10,
				offset: 5,
				unreadOnly: true,
				category: "billing",
			});
		});

		it("can be disabled", async () => {
			const { result } = renderHook(
				() => useNotificationsQuery({ enabled: false }),
				{
					wrapper: createWrapper(),
				},
			);

			expect(result.current.isLoading).toBe(false);
			expect(result.current.isFetching).toBe(false);
			expect(mockedNotifications.list).not.toHaveBeenCalled();
		});
	});

	describe("useNotificationsUnreadCountQuery", () => {
		it("fetches unread count", async () => {
			mockedNotifications.unreadCount.mockResolvedValueOnce({
				unreadCount: 5,
			});

			const { result } = renderHook(
				() => useNotificationsUnreadCountQuery(),
				{
					wrapper: createWrapper(),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual({ unreadCount: 5 });
		});

		it("can be disabled", async () => {
			const { result } = renderHook(
				() => useNotificationsUnreadCountQuery({ enabled: false }),
				{
					wrapper: createWrapper(),
				},
			);

			expect(result.current.isFetching).toBe(false);
			expect(mockedNotifications.unreadCount).not.toHaveBeenCalled();
		});
	});

	describe("useMarkNotificationAsReadMutation", () => {
		it("marks notification as read and invalidates queries", async () => {
			mockedNotifications.markAsRead.mockResolvedValueOnce({
				success: true,
			});

			// Set initial data
			queryClient.setQueryData(notificationsQueryKey, {
				notifications: [],
			});
			queryClient.setQueryData(notificationsUnreadCountQueryKey, {
				unreadCount: 1,
			});

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(
				() => useMarkNotificationAsReadMutation(),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate("notif-1");

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockedNotifications.markAsRead).toHaveBeenCalledWith({
				id: "notif-1",
			});
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsQueryKey,
			});
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsUnreadCountQueryKey,
			});
		});
	});

	describe("useMarkAllNotificationsAsReadMutation", () => {
		it("marks all notifications as read and invalidates queries", async () => {
			mockedNotifications.markAllAsRead.mockResolvedValueOnce({
				success: true,
				count: 5,
			});

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(
				() => useMarkAllNotificationsAsReadMutation(),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate();

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockedNotifications.markAllAsRead).toHaveBeenCalled();
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsQueryKey,
			});
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsUnreadCountQueryKey,
			});
		});
	});

	describe("useDeleteNotificationMutation", () => {
		it("deletes notification and invalidates queries", async () => {
			mockedNotifications.delete.mockResolvedValueOnce({ success: true });

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(
				() => useDeleteNotificationMutation(),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate("notif-1");

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockedNotifications.delete).toHaveBeenCalledWith({
				id: "notif-1",
			});
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsQueryKey,
			});
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: notificationsUnreadCountQueryKey,
			});
		});
	});

	describe("Query keys", () => {
		it("exports correct query keys", () => {
			expect(notificationsQueryKey).toEqual(["user", "notifications"]);
			expect(notificationsUnreadCountQueryKey).toEqual([
				"user",
				"notifications",
				"unreadCount",
			]);
		});
	});
});
