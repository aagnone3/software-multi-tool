"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@ui/components/sheet";
import { Textarea } from "@ui/components/textarea";
import { NotebookPenIcon, SaveIcon, Trash2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY_PREFIX = "tool-notes:";

interface ToolNotesDrawerProps {
	toolSlug: string;
	toolName: string;
	className?: string;
}

export function ToolNotesDrawer({
	toolSlug,
	toolName,
	className,
}: ToolNotesDrawerProps) {
	const { track } = useProductAnalytics();
	const [open, setOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const [savedNotes, setSavedNotes] = useState("");
	const storageKey = `${STORAGE_KEY_PREFIX}${toolSlug}`;

	useEffect(() => {
		if (open) {
			const stored = localStorage.getItem(storageKey) ?? "";
			setNotes(stored);
			setSavedNotes(stored);
			track({
				name: "tool_notes_opened",
				props: { tool_slug: toolSlug },
			});
		}
	}, [open, storageKey, toolSlug, track]);

	const isDirty = notes !== savedNotes;

	function handleSave() {
		localStorage.setItem(storageKey, notes);
		setSavedNotes(notes);
		toast.success("Notes saved");
		track({
			name: "tool_notes_saved",
			props: { tool_slug: toolSlug, character_count: notes.length },
		});
	}

	function handleClear() {
		localStorage.removeItem(storageKey);
		setNotes("");
		setSavedNotes("");
		toast.success("Notes cleared");
		track({ name: "tool_notes_cleared", props: { tool_slug: toolSlug } });
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm" className={className}>
					<NotebookPenIcon className="mr-1 h-4 w-4" />
					Notes
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="flex w-[400px] flex-col gap-4"
			>
				<SheetHeader>
					<SheetTitle>Notes — {toolName}</SheetTitle>
					<SheetDescription>
						Jot down anything useful while working with this tool.
						Notes are saved locally in your browser.
					</SheetDescription>
				</SheetHeader>
				<Textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Start typing your notes…"
					className="flex-1 resize-none"
					rows={16}
					aria-label="Tool notes"
				/>
				<div className="flex gap-2">
					<Button
						onClick={handleSave}
						disabled={!isDirty}
						size="sm"
						className="flex-1"
					>
						<SaveIcon className="mr-1 h-4 w-4" />
						{isDirty ? "Save changes" : "Saved"}
					</Button>
					<Button
						onClick={handleClear}
						variant="outline"
						size="sm"
						disabled={savedNotes === "" && notes === ""}
						aria-label="Clear notes"
					>
						<Trash2Icon className="h-4 w-4" />
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
