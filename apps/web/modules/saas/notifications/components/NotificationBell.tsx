"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import { BellIcon } from "lucide-react";
import * as React from "react";
import { useNotificationsUnreadCountQuery } from "../lib/api";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
	const [isOpen, setIsOpen] = React.useState(false);

	const { data } = useNotificationsUnreadCountQuery();
	const unreadCount = data?.unreadCount ?? 0;

	const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString();

	return (
		<DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="relative flex size-9 cursor-pointer items-center justify-center rounded-md outline-hidden transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
					aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
				>
					<BellIcon className="size-5 text-foreground/70" />

					{/* Unread count badge */}
					{unreadCount > 0 && (
						<span
							className={cn(
								"absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs",
								unreadCount > 9 ? "h-5 min-w-5 px-1" : "size-4",
							)}
						>
							{displayCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="p-0" sideOffset={8}>
				<NotificationDropdown onClose={() => setIsOpen(false)} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
