"use client";

import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import { ChevronDown, ChevronUp, Save, StickyNote, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const NOTES_STORAGE_KEY = "tool-notes";

function getStoredNotes(): Record<string, string> {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function saveNote(toolSlug: string, note: string): void {
	const notes = getStoredNotes();
	if (note.trim() === "") {
		delete notes[toolSlug];
	} else {
		notes[toolSlug] = note;
	}
	localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

interface ToolNotesProps {
	toolSlug: string;
	className?: string;
}

export function ToolNotes({ toolSlug, className }: ToolNotesProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [note, setNote] = useState("");
	const [savedNote, setSavedNote] = useState("");
	const [isDirty, setIsDirty] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const notes = getStoredNotes();
		const existing = notes[toolSlug] ?? "";
		setNote(existing);
		setSavedNote(existing);
	}, [toolSlug]);

	useEffect(() => {
		setIsDirty(note !== savedNote);
	}, [note, savedNote]);

	function handleToggle() {
		const next = !isOpen;
		setIsOpen(next);
		if (next) {
			setTimeout(() => textareaRef.current?.focus(), 50);
		}
	}

	function handleSave() {
		saveNote(toolSlug, note);
		setSavedNote(note);
		setIsDirty(false);
		toast.success("Note saved");
	}

	function handleDelete() {
		saveNote(toolSlug, "");
		setNote("");
		setSavedNote("");
		setIsDirty(false);
		toast.success("Note cleared");
	}

	const hasNote = savedNote.trim().length > 0;

	return (
		<div className={className}>
			<Button
				variant="outline"
				size="sm"
				onClick={handleToggle}
				className="gap-2"
			>
				<StickyNote className="h-4 w-4" />
				My Notes
				{hasNote && (
					<span
						className="inline-flex h-2 w-2 rounded-full bg-amber-400"
						role="img"
						aria-label="has note"
					/>
				)}
				{isOpen ? (
					<ChevronUp className="h-3 w-3 text-muted-foreground" />
				) : (
					<ChevronDown className="h-3 w-3 text-muted-foreground" />
				)}
			</Button>

			{isOpen && (
				<div className="mt-3 rounded-lg border bg-card p-3 space-y-3">
					<Textarea
						ref={textareaRef}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Add personal notes about this tool — tips, reminders, common inputs..."
						rows={4}
						className="resize-none text-sm"
						aria-label="Tool notes"
					/>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs text-muted-foreground">
							{note.length > 0
								? `${note.length} characters`
								: "No notes yet"}
						</span>
						<div className="flex gap-2">
							{hasNote && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDelete}
									className="gap-1 text-destructive hover:text-destructive"
									aria-label="Clear note"
								>
									<Trash2 className="h-3 w-3" />
									Clear
								</Button>
							)}
							<Button
								size="sm"
								onClick={handleSave}
								disabled={!isDirty}
								className="gap-1"
								aria-label="Save note"
							>
								<Save className="h-3 w-3" />
								Save
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
