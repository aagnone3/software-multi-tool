"use client";

import { Spinner } from "@shared/components/Spinner";
import { Button } from "@ui/components/button";
import { CheckCheckIcon, InboxIcon } from "lucide-react";
import * as React from "react";
import {
	useDeleteNotificationMutation,
	useMarkAllNotificationsAsReadMutation,
	useMarkNotificationAsReadMutation,
	useNotificationsQuery,
} from "../lib/api";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
	onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
	const { data, isLoading, isError } = useNotificationsQuery({
		limit: 20,
	});

	const markAsReadMutation = useMarkNotificationAsReadMutation();
	const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();
	const deleteMutation = useDeleteNotificationMutation();

	const notifications = data?.notifications ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	const handleMarkAsRead = (id: string) => {
		markAsReadMutation.mutate(id);
	};

	const handleMarkAllAsRead = () => {
		markAllAsReadMutation.mutate();
	};

	const handleDelete = (id: string) => {
		deleteMutation.mutate(id);
	};

	const handleNotificationClick = (actionUrl?: string | null) => {
		if (actionUrl && onClose) {
			onClose();
		}
	};

	return (
		<div className="flex max-h-[400px] w-[360px] flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h3 className="font-semibold text-sm">Notifications</h3>
				{unreadCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-auto px-2 py-1 text-xs"
						onClick={handleMarkAllAsRead}
						disabled={markAllAsReadMutation.isPending}
					>
						<CheckCheckIcon className="mr-1 size-3" />
						Mark all as read
					</Button>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<Spinner className="size-6" />
					</div>
				)}

				{isError && (
					<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<p className="text-sm">Failed to load notifications</p>
					</div>
				)}

				{!isLoading && !isError && notifications.length === 0 && (
					<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<InboxIcon className="mb-2 size-8 opacity-50" />
						<p className="text-sm">No notifications yet</p>
						<p className="text-xs opacity-70">
							We'll let you know when something arrives
						</p>
					</div>
				)}

				{!isLoading && !isError && notifications.length > 0 && (
					<div className="divide-y">
						{notifications.map(
							(notification: (typeof notifications)[number]) => (
								<NotificationItem
									key={notification.id}
									id={notification.id}
									type={notification.type}
									title={notification.title}
									body={notification.body}
									actionUrl={notification.actionUrl}
									read={notification.read}
									createdAt={notification.createdAt}
									onMarkAsRead={(id) => {
										handleMarkAsRead(id);
										handleNotificationClick(
											notification.actionUrl,
										);
									}}
									onDelete={handleDelete}
								/>
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
}
