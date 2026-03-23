"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import { MessageSquareIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface ToolFeedbackButtonProps {
	toolSlug: string;
	jobId?: string;
	className?: string;
}

type Rating = "POSITIVE" | "NEGATIVE";

export function ToolFeedbackButton({
	toolSlug,
	jobId,
	className,
}: ToolFeedbackButtonProps) {
	const [open, setOpen] = useState(false);
	const [rating, setRating] = useState<Rating | null>(null);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit() {
		if (!rating) {
			return;
		}

		setSubmitting(true);
		try {
			await orpcClient.feedback.create({
				toolSlug,
				rating,
				jobId,
				chatTranscript: comment.trim() || undefined,
			});
			toast.success("Thanks for your feedback!");
			setOpen(false);
			setRating(null);
			setComment("");
		} catch {
			toast.error("Failed to submit feedback. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn("gap-1.5", className)}
				>
					<MessageSquareIcon className="size-4" />
					Feedback
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share your feedback</DialogTitle>
					<DialogDescription>
						How was your experience with this tool? Your feedback
						helps us improve.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => setRating("POSITIVE")}
							className={cn(
								"flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
								rating === "POSITIVE"
									? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
									: "border-border hover:bg-muted",
							)}
						>
							<ThumbsUpIcon className="size-4" />
							Helpful
						</button>
						<button
							type="button"
							onClick={() => setRating("NEGATIVE")}
							className={cn(
								"flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
								rating === "NEGATIVE"
									? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
									: "border-border hover:bg-muted",
							)}
						>
							<ThumbsDownIcon className="size-4" />
							Not helpful
						</button>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="feedback-comment">
							Additional comments{" "}
							<span className="text-muted-foreground">
								(optional)
							</span>
						</Label>
						<Textarea
							id="feedback-comment"
							placeholder="What worked well? What could be improved?"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!rating || submitting}
					>
						{submitting ? "Submitting…" : "Submit feedback"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
