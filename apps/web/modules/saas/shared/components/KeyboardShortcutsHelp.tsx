"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { cn } from "@ui/lib";
import { KeyboardIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface Shortcut {
	keys: string[];
	description: string;
}

interface ShortcutGroup {
	title: string;
	shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
	{
		title: "Navigation",
		shortcuts: [
			{ keys: ["⌘", "K"], description: "Open command palette" },
			{ keys: ["G", "H"], description: "Go to dashboard" },
			{ keys: ["G", "T"], description: "Go to tools" },
			{ keys: ["G", "J"], description: "Go to job history" },
			{ keys: ["G", "S"], description: "Go to settings" },
		],
	},
	{
		title: "General",
		shortcuts: [
			{ keys: ["?"], description: "Show keyboard shortcuts" },
			{ keys: ["Esc"], description: "Close dialogs / cancel" },
		],
	},
];

function KeyBadge({ keyLabel }: { keyLabel: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center justify-center",
				"px-1.5 py-0.5 rounded border",
				"text-xs font-mono font-semibold",
				"border-muted-foreground/30 bg-muted text-foreground",
			)}
		>
			{keyLabel}
		</span>
	);
}

export function KeyboardShortcutsHelp() {
	const [open, setOpen] = useState(false);

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		// Don't trigger when typing in inputs
		const tag = (e.target as HTMLElement).tagName.toLowerCase();
		if (tag === "input" || tag === "textarea" || tag === "select") {
			return;
		}
		if (
			(e.target as HTMLElement).isContentEditable ||
			e.metaKey ||
			e.ctrlKey ||
			e.altKey
		) {
			return;
		}

		if (e.key === "?") {
			e.preventDefault();
			setOpen((prev) => !prev);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<KeyboardIcon className="size-4" />
						Keyboard Shortcuts
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-6">
					{SHORTCUT_GROUPS.map((group) => (
						<div key={group.title}>
							<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
								{group.title}
							</h3>
							<div className="space-y-2">
								{group.shortcuts.map((shortcut) => (
									<div
										key={shortcut.description}
										className="flex items-center justify-between"
									>
										<span className="text-sm text-foreground">
											{shortcut.description}
										</span>
										<div className="flex items-center gap-1">
											{shortcut.keys.map((key, i) => (
												<React.Fragment key={key}>
													<KeyBadge keyLabel={key} />
													{i <
														shortcut.keys.length -
															1 && (
														<span className="text-xs text-muted-foreground">
															+
														</span>
													)}
												</React.Fragment>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
				<p className="text-xs text-muted-foreground text-center pt-2">
					Press <KeyBadge keyLabel="?" /> again or{" "}
					<KeyBadge keyLabel="Esc" /> to close
				</p>
			</DialogContent>
		</Dialog>
	);
}
