"use client";

import {
	useMarkNotificationAsReadMutation,
	useNotificationsQuery,
	useNotificationsUnreadCountQuery,
} from "@saas/notifications/lib/api";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	BellIcon,
	CheckCircleIcon,
	ChevronRightIcon,
	InboxIcon,
	InfoIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationsWidgetProps {
	className?: string;
	maxItems?: number;
}

const typeIcons = {
	info: InfoIcon,
	success: CheckCircleIcon,
	warning: AlertTriangleIcon,
	error: AlertCircleIcon,
} as const;

const typeColors = {
	info: "text-primary",
	success: "text-emerald-500",
	warning: "text-amber-500",
	error: "text-rose-500",
} as const;

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return "Just now";
	}
	if (diffMins < 60) {
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString();
}

export function NotificationsWidget({
	className,
	maxItems = 4,
}: NotificationsWidgetProps) {
	const router = useRouter();
	const { data: unreadData } = useNotificationsUnreadCountQuery();
	const { data, isLoading } = useNotificationsQuery({ limit: maxItems });
	const markAsReadMutation = useMarkNotificationAsReadMutation();

	const notifications = data?.notifications ?? [];
	const unreadCount = unreadData?.unreadCount ?? 0;

	const handleNotificationClick = (
		id: string,
		read: boolean,
		actionUrl?: string | null,
	) => {
		if (!read) {
			markAsReadMutation.mutate(id);
		}
		if (actionUrl) {
			router.push(actionUrl);
		}
	};

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BellIcon className="size-5" />
						Notifications
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="flex items-start gap-3"
						>
							<Skeleton className="size-8 rounded-full" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<BellIcon className="size-5" />
						Notifications
						{unreadCount > 0 && (
							<Badge status="info" className="h-5 px-1.5 text-xs">
								{unreadCount}
							</Badge>
						)}
					</CardTitle>
				</div>
				<CardDescription>
					{unreadCount > 0
						? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
						: "Your recent notifications"}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-1">
				{notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<InboxIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No notifications yet
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							We'll let you know when something arrives
						</p>
					</div>
				) : (
					<>
						{notifications.map(
							(notification: (typeof notifications)[number]) => {
								const IconComponent =
									typeIcons[
										notification.type as keyof typeof typeIcons
									] ?? InfoIcon;
								const iconColor =
									typeColors[
										notification.type as keyof typeof typeColors
									] ?? "text-primary";

								return (
									<button
										key={notification.id}
										type="button"
										className={cn(
											"flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50",
											!notification.read &&
												"bg-primary/5",
										)}
										onClick={() =>
											handleNotificationClick(
												notification.id,
												notification.read,
												notification.actionUrl,
											)
										}
									>
										{/* Unread indicator */}
										<div className="relative mt-0.5 shrink-0">
											{!notification.read && (
												<div className="absolute -left-1 -top-1 size-2 rounded-full bg-primary" />
											)}
											<div className={iconColor}>
												<IconComponent className="size-4" />
											</div>
										</div>

										{/* Content */}
										<div className="min-w-0 flex-1">
											<p
												className={cn(
													"text-sm truncate",
													!notification.read
														? "font-medium"
														: "font-normal",
												)}
											>
												{notification.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatTimeAgo(
													new Date(
														notification.createdAt,
													),
												)}
											</p>
										</div>
									</button>
								);
							},
						)}

						<div className="pt-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								asChild
							>
								<Link href="/app/notifications">
									View all notifications
									<ChevronRightIcon className="size-4 ml-1" />
								</Link>
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
