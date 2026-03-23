"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Textarea } from "@ui/components/textarea";
import {
	MessageSquarePlusIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
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

	const { mutate: submitFeedback, isPending } = useMutation({
		mutationFn: async () => {
			if (!rating) throw new Error("Please select a rating");
			return orpcClient.feedback.create({
				toolSlug,
				rating,
				jobId,
				chatTranscript: comment || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Thanks for your feedback!");
			setOpen(false);
			setRating(null);
			setComment("");
		},
		onError: () => {
			toast.error("Failed to submit feedback. Please try again.");
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={`size-8 text-muted-foreground hover:text-foreground ${className ?? ""}`}
					aria-label="Give feedback on this tool"
					title="Give feedback"
				>
					<MessageSquarePlusIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Rate this tool</DialogTitle>
					<DialogDescription>
						Your feedback helps us improve. Did this tool meet your
						expectations?
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Rating buttons */}
					<div className="flex gap-3">
						<Button
							variant={
								rating === "POSITIVE" ? "primary" : "outline"
							}
							className="flex-1 gap-2"
							onClick={() => setRating("POSITIVE")}
						>
							<ThumbsUpIcon className="size-4" />
							Yes, great!
						</Button>
						<Button
							variant={
								rating === "NEGATIVE" ? "error" : "outline"
							}
							className="flex-1 gap-2"
							onClick={() => setRating("NEGATIVE")}
						>
							<ThumbsDownIcon className="size-4" />
							Needs work
						</Button>
					</div>

					{/* Comment field */}
					<Textarea
						placeholder="Optional: tell us more (what worked, what didn't)..."
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						rows={3}
						className="resize-none"
					/>

					{/* Submit */}
					<Button
						className="w-full"
						disabled={!rating || isPending}
						onClick={() => submitFeedback()}
					>
						{isPending ? "Submitting..." : "Submit feedback"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
