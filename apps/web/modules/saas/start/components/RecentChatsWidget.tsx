"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
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
	ChevronRightIcon,
	MessageSquareIcon,
	MessagesSquareIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";

interface RecentChatsWidgetProps {
	className?: string;
	maxChats?: number;
}

function formatTimeAgo(dateInput: string | Date): string {
	const date =
		typeof dateInput === "string" ? new Date(dateInput) : dateInput;
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

export function RecentChatsWidget({
	className,
	maxChats = 4,
}: RecentChatsWidgetProps) {
	const { activeOrganization } = useActiveOrganization();

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	const { data, isLoading } = useQuery(
		orpc.ai.chats.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id,
			},
		}),
	);

	const chats = data?.chats ?? [];

	// Sort by most recent first and limit
	const recentChats = chats
		.sort(
			(a: (typeof chats)[number], b: (typeof chats)[number]) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		)
		.slice(0, maxChats);

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessagesSquareIcon className="size-5" />
						Recent Chats
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="flex items-center gap-3"
						>
							<Skeleton className="size-10 rounded-lg" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (recentChats.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessagesSquareIcon className="size-5" />
						Recent Chats
					</CardTitle>
					<CardDescription>Your AI conversations</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<MessageSquareIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No chats yet
						</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							asChild
						>
							<Link href={`${basePath}/chatbot`}>
								<PlusIcon className="size-4 mr-1" />
								Start a chat
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<MessagesSquareIcon className="size-5" />
					Recent Chats
				</CardTitle>
				<CardDescription>Continue your conversations</CardDescription>
			</CardHeader>
			<CardContent className="space-y-1">
				{recentChats.map((chat: (typeof chats)[number]) => {
					// Try to get the first message or use title
					const firstMessage = (
						chat.messages as Array<{ content?: string }> | undefined
					)?.at(0);
					const displayTitle =
						chat.title ||
						(firstMessage?.content
							? String(firstMessage.content).slice(0, 50) +
								(String(firstMessage.content).length > 50
									? "..."
									: "")
							: "Untitled chat");

					return (
						<Link
							key={chat.id}
							href={`${basePath}/chatbot?chatId=${chat.id}`}
							className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
						>
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
								<MessageSquareIcon className="size-5" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">
									{displayTitle}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatTimeAgo(chat.createdAt)}
								</p>
							</div>
							<ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
						</Link>
					);
				})}

				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full"
						asChild
					>
						<Link href={`${basePath}/chatbot`}>
							View all chats
							<ChevronRightIcon className="size-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
