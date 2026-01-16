"use client";

import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircleIcon,
	InfoIcon,
	TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface NotificationItemProps {
	id: string;
	type: string;
	title: string;
	body: string;
	actionUrl?: string | null;
	read: boolean;
	createdAt: Date;
	onMarkAsRead?: (id: string) => void;
	onDelete?: (id: string) => void;
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
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) {
		return "just now";
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

export function NotificationItem({
	id,
	type,
	title,
	body,
	actionUrl,
	read,
	createdAt,
	onMarkAsRead,
	onDelete,
}: NotificationItemProps) {
	const router = useRouter();

	const IconComponent = typeIcons[type as keyof typeof typeIcons] ?? InfoIcon;
	const iconColor =
		typeColors[type as keyof typeof typeColors] ?? "text-primary";

	const handleClick = () => {
		if (!read && onMarkAsRead) {
			onMarkAsRead(id);
		}
		if (actionUrl) {
			router.push(actionUrl);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete) {
			onDelete(id);
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: Using div with role="button" to allow nested delete button
		<div
			role="button"
			tabIndex={0}
			className={cn(
				"group relative flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
				!read && "bg-primary/5",
			)}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleClick();
				}
			}}
		>
			{/* Unread indicator */}
			{!read && (
				<div className="absolute top-4 left-1.5 size-2 rounded-full bg-primary" />
			)}

			{/* Icon */}
			<div className={cn("mt-0.5 shrink-0", iconColor)}>
				<IconComponent className="size-5" />
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-sm",
						!read ? "font-medium" : "font-normal",
					)}
				>
					{title}
				</p>
				<p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
					{body}
				</p>
				<p className="mt-1 text-muted-foreground/70 text-xs">
					{formatTimeAgo(new Date(createdAt))}
				</p>
			</div>

			{/* Delete button (visible on hover) */}
			<button
				type="button"
				className="absolute top-3 right-3 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
				onClick={handleDelete}
				aria-label="Delete notification"
			>
				<TrashIcon className="size-4 text-muted-foreground hover:text-destructive" />
			</button>
		</div>
	);
}
