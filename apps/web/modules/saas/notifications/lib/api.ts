import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const notificationsQueryKey = ["user", "notifications"] as const;
export const notificationsUnreadCountQueryKey = [
	"user",
	"notifications",
	"unreadCount",
] as const;

// List notifications query
export const useNotificationsQuery = (options?: {
	limit?: number;
	offset?: number;
	unreadOnly?: boolean;
	category?: string;
	enabled?: boolean;
}) => {
	return useQuery({
		queryKey: [
			...notificationsQueryKey,
			{
				limit: options?.limit ?? 20,
				offset: options?.offset ?? 0,
				unreadOnly: options?.unreadOnly,
				category: options?.category,
			},
		],
		queryFn: async () => {
			const result = await orpcClient.notifications.list({
				limit: options?.limit ?? 20,
				offset: options?.offset ?? 0,
				unreadOnly: options?.unreadOnly,
				category: options?.category,
			});

			return result;
		},
		refetchInterval: 30000, // Poll every 30 seconds
		enabled: options?.enabled !== false,
	});
};

// Unread count query (lightweight, for badge)
export const useNotificationsUnreadCountQuery = (options?: {
	enabled?: boolean;
}) => {
	return useQuery({
		queryKey: notificationsUnreadCountQueryKey,
		queryFn: async () => {
			const result = await orpcClient.notifications.unreadCount();
			return result;
		},
		refetchInterval: 30000, // Poll every 30 seconds
		enabled: options?.enabled !== false,
	});
};

// Mark single notification as read
export const useMarkNotificationAsReadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const result = await orpcClient.notifications.markAsRead({
				id: notificationId,
			});
			return result;
		},
		onSuccess: () => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({
				queryKey: notificationsQueryKey,
			});
			queryClient.invalidateQueries({
				queryKey: notificationsUnreadCountQueryKey,
			});
		},
	});
};

// Mark all notifications as read
export const useMarkAllNotificationsAsReadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const result = await orpcClient.notifications.markAllAsRead();
			return result;
		},
		onSuccess: () => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({
				queryKey: notificationsQueryKey,
			});
			queryClient.invalidateQueries({
				queryKey: notificationsUnreadCountQueryKey,
			});
		},
	});
};

// Delete notification
export const useDeleteNotificationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const result = await orpcClient.notifications.delete({
				id: notificationId,
			});
			return result;
		},
		onSuccess: () => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({
				queryKey: notificationsQueryKey,
			});
			queryClient.invalidateQueries({
				queryKey: notificationsUnreadCountQueryKey,
			});
		},
	});
};
