"use client";

import { config } from "@repo/config";
import type { ToolConfig } from "@repo/config/types";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Command } from "cmdk";
import {
	BotMessageSquareIcon,
	CreditCardIcon,
	HomeIcon,
	ImageMinusIcon,
	NewspaperIcon,
	SearchIcon,
	SettingsIcon,
	UserCog2Icon,
	UserCogIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
}

interface NavigationItem {
	id: string;
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	description: string;
}

type RecentItemType = "tool" | "page";

interface RecentItem {
	id: string;
	type: RecentItemType;
}

function getToolIcon(iconName: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		"image-minus": ImageMinusIcon,
		users: UsersIcon,
		newspaper: NewspaperIcon,
	};

	return icons[iconName] || WrenchIcon;
}

const RECENT_ITEMS_KEY = "command-palette:recent-items";
const MAX_RECENT_ITEMS = 5;

function getRecentItems(): RecentItem[] {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		const stored = localStorage.getItem(RECENT_ITEMS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function addRecentItem(id: string, type: RecentItemType): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const recent = getRecentItems().filter((item) => item.id !== id);
		recent.unshift({ id, type });
		const trimmed = recent.slice(0, MAX_RECENT_ITEMS);
		localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(trimmed));
	} catch {
		// Ignore storage errors
	}
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
	const router = useRouter();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const [search, setSearch] = useState("");
	const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	// Build navigation items
	const navigationItems = useMemo<NavigationItem[]>(() => {
		const items: NavigationItem[] = [
			{
				id: "home",
				label: "Start",
				href: basePath,
				icon: HomeIcon,
				description: "Go to home page",
			},
			{
				id: "chatbot",
				label: "AI Chatbot",
				href: activeOrganization
					? `/app/${activeOrganization.slug}/chatbot`
					: "/app/chatbot",
				icon: BotMessageSquareIcon,
				description: "Chat with AI assistant",
			},
			{
				id: "settings",
				label: "Settings",
				href: "/app/settings/general",
				icon: UserCog2Icon,
				description: "Manage your account settings",
			},
			{
				id: "usage",
				label: "Usage",
				href: "/app/settings/billing/usage",
				icon: CreditCardIcon,
				description: "View your usage and billing",
			},
		];

		if (activeOrganization && !config.organizations.hideOrganization) {
			items.push({
				id: "org-settings",
				label: "Organization settings",
				href: `${basePath}/settings`,
				icon: SettingsIcon,
				description: "Manage organization settings",
			});
		}

		if (user?.role === "admin") {
			items.push({
				id: "admin",
				label: "Admin",
				href: "/app/admin",
				icon: UserCogIcon,
				description: "Admin dashboard",
			});
		}

		return items;
	}, [basePath, activeOrganization, user]);

	// Load recent items on mount
	useEffect(() => {
		setRecentItems(getRecentItems());
	}, []);

	// Auto-focus input when palette opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			// Small timeout to ensure the component is fully rendered
			setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
		}
	}, [isOpen]);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Close on Escape
			if (e.key === "Escape" && isOpen) {
				onClose();
			}

			// Open on Cmd+K (Mac) or Ctrl+K (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				if (isOpen) {
					onClose();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Reset search when closing
	useEffect(() => {
		if (!isOpen) {
			setSearch("");
		}
	}, [isOpen]);

	const handleSelectTool = (tool: ToolConfig) => {
		addRecentItem(tool.slug, "tool");
		setRecentItems(getRecentItems());
		router.push(`/app/tools/${tool.slug}`);
		onClose();
	};

	const handleSelectPage = (page: NavigationItem) => {
		addRecentItem(page.id, "page");
		setRecentItems(getRecentItems());
		router.push(page.href);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	const enabledTools = config.tools.registry.filter((tool) => tool.enabled);

	// Build recent items list
	const recentList: Array<
		| { type: "tool"; data: ToolConfig }
		| { type: "page"; data: NavigationItem }
	> = [];

	for (const item of recentItems) {
		if (item.type === "tool") {
			const tool = enabledTools.find((t) => t.slug === item.id);
			if (tool) {
				recentList.push({ type: "tool", data: tool });
			}
		} else {
			const page = navigationItems.find((p) => p.id === item.id);
			if (page) {
				recentList.push({ type: "page", data: page });
			}
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay should be clickable
		// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard events handled by Command component inside
		<div
			className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
			onClick={onClose}
		>
			<div className="fixed left-1/2 top-[20%] w-full max-w-2xl -translate-x-1/2 px-4">
				<Command
					className="rounded-lg border bg-popover shadow-lg"
					onClick={(e) => e.stopPropagation()}
					label="Command Palette"
				>
					<div className="flex items-center border-b px-3">
						<SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
						<Command.Input
							ref={inputRef}
							value={search}
							onValueChange={setSearch}
							placeholder="Search pages and tools..."
							className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
						<Command.Empty className="py-6 text-center text-sm text-muted-foreground">
							No results found.
						</Command.Empty>

						{recentList.length > 0 && (
							<Command.Group
								heading="Recently Used"
								className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
							>
								{recentList.map((item) => {
									if (item.type === "tool") {
										const tool = item.data;
										const Icon = getToolIcon(tool.icon);
										return (
											<Command.Item
												key={`tool-${tool.slug}`}
												value={tool.slug}
												onSelect={() =>
													handleSelectTool(tool)
												}
												className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground"
											>
												<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
													<Icon className="size-4" />
												</div>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">
														{tool.name}
													</span>
													<span className="text-xs text-muted-foreground">
														{tool.description}
													</span>
												</div>
											</Command.Item>
										);
									}
									const page = item.data;
									const Icon = page.icon;
									return (
										<Command.Item
											key={`page-${page.id}`}
											value={page.id}
											onSelect={() =>
												handleSelectPage(page)
											}
											className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground"
										>
											<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
												<Icon className="size-4" />
											</div>
											<div className="flex flex-col gap-0.5">
												<span className="font-medium">
													{page.label}
												</span>
												<span className="text-xs text-muted-foreground">
													{page.description}
												</span>
											</div>
										</Command.Item>
									);
								})}
							</Command.Group>
						)}

						<Command.Group
							heading="Jump to Page"
							className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
						>
							{navigationItems.map((page) => {
								const Icon = page.icon;
								return (
									<Command.Item
										key={page.id}
										value={`${page.label} ${page.description} ${page.id}`}
										onSelect={() => handleSelectPage(page)}
										className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
											<Icon className="size-4" />
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="font-medium">
												{page.label}
											</span>
											<span className="text-xs text-muted-foreground">
												{page.description}
											</span>
										</div>
									</Command.Item>
								);
							})}
						</Command.Group>

						<Command.Group
							heading="Jump to Tool"
							className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
						>
							{enabledTools.map((tool) => {
								const Icon = getToolIcon(tool.icon);
								return (
									<Command.Item
										key={tool.slug}
										value={`${tool.name} ${tool.description} ${tool.slug}`}
										onSelect={() => handleSelectTool(tool)}
										className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
											<Icon className="size-4" />
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="font-medium">
												{tool.name}
											</span>
											<span className="text-xs text-muted-foreground">
												{tool.description}
											</span>
										</div>
									</Command.Item>
								);
							})}
						</Command.Group>
					</Command.List>
					<div className="border-t px-3 py-2 text-xs text-muted-foreground">
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
							<span className="text-xs">↑↓</span>
						</kbd>{" "}
						to navigate{" "}
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
							<span className="text-xs">↵</span>
						</kbd>{" "}
						to select{" "}
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
							<span className="text-xs">ESC</span>
						</kbd>{" "}
						to close
					</div>
				</Command>
			</div>
		</div>
	);
}
