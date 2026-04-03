"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Textarea } from "@ui/components/textarea";
import { EditIcon, SaveIcon, StickyNoteIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY_PREFIX = "job-note:";

function getStorageKey(jobId: string) {
	return `${STORAGE_KEY_PREFIX}${jobId}`;
}

interface JobNotesPanelProps {
	jobId: string;
	className?: string;
}

export function JobNotesPanel({ jobId, className }: JobNotesPanelProps) {
	const { track } = useProductAnalytics();
	const [note, setNote] = useState("");
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");

	useEffect(() => {
		try {
			const stored = localStorage.getItem(getStorageKey(jobId));
			if (stored) {
				setNote(stored);
			}
		} catch {
			// localStorage unavailable
		}
	}, [jobId]);

	function handleEdit() {
		setDraft(note);
		setEditing(true);
	}

	function handleCancel() {
		setEditing(false);
		setDraft("");
	}

	function handleSave() {
		try {
			if (draft.trim()) {
				localStorage.setItem(getStorageKey(jobId), draft.trim());
				setNote(draft.trim());
				track({
					name: "job_note_saved",
					props: { job_id: jobId, note_length: draft.trim().length },
				});
			} else {
				localStorage.removeItem(getStorageKey(jobId));
				setNote("");
				track({ name: "job_note_cleared", props: { job_id: jobId } });
			}
			setEditing(false);
			toast.success("Note saved");
		} catch {
			toast.error("Failed to save note");
		}
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<StickyNoteIcon className="text-muted-foreground size-4" />
						<CardTitle className="text-sm">Notes</CardTitle>
					</div>
					{!editing && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleEdit}
							aria-label={note ? "Edit note" : "Add note"}
						>
							<EditIcon className="size-3.5 mr-1" />
							{note ? "Edit" : "Add note"}
						</Button>
					)}
				</div>
				<CardDescription className="text-xs">
					Private notes for this job (stored locally)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{editing ? (
					<div className="space-y-2">
						<Textarea
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder="Add a note about this job…"
							className="min-h-[80px] text-sm"
							autoFocus
						/>
						<div className="flex gap-2 justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
							>
								<XIcon className="size-3.5 mr-1" />
								Cancel
							</Button>
							<Button size="sm" onClick={handleSave}>
								<SaveIcon className="size-3.5 mr-1" />
								Save
							</Button>
						</div>
					</div>
				) : note ? (
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{note}
					</p>
				) : (
					<p className="text-sm text-muted-foreground italic">
						No notes yet. Click &quot;Add note&quot; to add one.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
