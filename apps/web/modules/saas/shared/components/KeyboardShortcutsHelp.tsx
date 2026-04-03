"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import React, { useEffect, useState } from "react";

const SHORTCUTS = [
	{
		category: "Navigation",
		items: [
			{ keys: ["g", "h"], description: "Go to Dashboard" },
			{ keys: ["g", "t"], description: "Go to Tools" },
			{ keys: ["g", "j"], description: "Go to Jobs" },
			{ keys: ["g", "s"], description: "Go to Settings" },
		],
	},
	{
		category: "Help",
		items: [{ keys: ["?"], description: "Show keyboard shortcuts" }],
	},
];

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-sm">
			{children}
		</kbd>
	);
}

export function KeyboardShortcutsHelp() {
	const [open, setOpen] = useState(false);
	const { track } = useProductAnalytics();

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Don't trigger when typing in inputs
			const tag = (e.target as HTMLElement).tagName?.toLowerCase() ?? "";
			if (
				tag === "input" ||
				tag === "textarea" ||
				tag === "select" ||
				(e.target as HTMLElement).isContentEditable
			) {
				return;
			}
			if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				setOpen((prev) => {
					if (!prev) {
						track({ name: "keyboard_shortcuts_opened", props: {} });
					}
					return !prev;
				});
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Keyboard Shortcuts
						<span className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
							?
						</span>
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-6 py-2">
					{SHORTCUTS.map((group) => (
						<div key={group.category}>
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{group.category}
							</h3>
							<div className="space-y-2">
								{group.items.map((item) => (
									<div
										key={item.description}
										className="flex items-center justify-between"
									>
										<span className="text-sm text-foreground">
											{item.description}
										</span>
										<div className="flex items-center gap-1">
											{item.keys.map((key, i) => (
												<React.Fragment key={key}>
													<Kbd>{key}</Kbd>
													{i <
														item.keys.length -
															1 && (
														<span className="text-xs text-muted-foreground">
															then
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
			</DialogContent>
		</Dialog>
	);
}
