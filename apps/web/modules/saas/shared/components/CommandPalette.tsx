"use client";

import { config } from "@repo/config";
import type { ToolConfig } from "@repo/config/types";
import { Command } from "cmdk";
import {
	ImageMinusIcon,
	NewspaperIcon,
	SearchIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
}

function getToolIcon(iconName: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		"image-minus": ImageMinusIcon,
		users: UsersIcon,
		newspaper: NewspaperIcon,
	};

	return icons[iconName] || WrenchIcon;
}

const RECENT_TOOLS_KEY = "command-palette:recent-tools";
const MAX_RECENT_TOOLS = 5;

function getRecentTools(): string[] {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		const stored = localStorage.getItem(RECENT_TOOLS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function addRecentTool(slug: string): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const recent = getRecentTools().filter((s) => s !== slug);
		recent.unshift(slug);
		const trimmed = recent.slice(0, MAX_RECENT_TOOLS);
		localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(trimmed));
	} catch {
		// Ignore storage errors
	}
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [recentToolSlugs, setRecentToolSlugs] = useState<string[]>([]);

	// Load recent tools on mount
	useEffect(() => {
		setRecentToolSlugs(getRecentTools());
	}, []);

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
		addRecentTool(tool.slug);
		setRecentToolSlugs(getRecentTools());
		router.push(`/app/tools/${tool.slug}`);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	const enabledTools = config.tools.registry.filter((tool) => tool.enabled);
	const recentTools = recentToolSlugs
		.map((slug) => enabledTools.find((tool) => tool.slug === slug))
		.filter(
			(tool): tool is (typeof enabledTools)[number] => tool !== undefined,
		);

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
					label="Tool Switcher"
				>
					<div className="flex items-center border-b px-3">
						<SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
						<Command.Input
							value={search}
							onValueChange={setSearch}
							placeholder="Search tools..."
							className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
						<Command.Empty className="py-6 text-center text-sm text-muted-foreground">
							No tools found.
						</Command.Empty>

						{recentTools.length > 0 && (
							<Command.Group
								heading="Recently Used"
								className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
							>
								{recentTools.map((tool) => {
									const Icon = getToolIcon(tool.icon);
									return (
										<Command.Item
											key={tool.slug}
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
								})}
							</Command.Group>
						)}

						<Command.Group
							heading="All Tools"
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
