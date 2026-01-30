"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ToolFeedbackProps {
	toolSlug: string;
	jobId?: string;
	className?: string;
	onFeedbackSubmitted?: (rating: "POSITIVE" | "NEGATIVE") => void;
}

export function ToolFeedback({
	toolSlug,
	jobId,
	className,
	onFeedbackSubmitted,
}: ToolFeedbackProps) {
	const [submittedRating, setSubmittedRating] = useState<
		"POSITIVE" | "NEGATIVE" | null
	>(null);

	const feedbackMutation = useMutation(
		orpc.feedback.create.mutationOptions(),
	);

	const handleFeedback = async (rating: "POSITIVE" | "NEGATIVE") => {
		if (submittedRating) {
			return; // Already submitted
		}

		try {
			await feedbackMutation.mutateAsync({
				toolSlug,
				rating,
				jobId,
			});
			setSubmittedRating(rating);
			onFeedbackSubmitted?.(rating);
			toast.success("Thank you for your feedback!");
		} catch {
			toast.error("Failed to submit feedback. Please try again.");
		}
	};

	const isLoading = feedbackMutation.isPending;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span className="text-sm text-muted-foreground">
				Was this helpful?
			</span>
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 rounded-full transition-colors",
						submittedRating === "POSITIVE" &&
							"bg-emerald-100 text-emerald-600 hover:bg-emerald-100",
						submittedRating === "NEGATIVE" && "opacity-30",
					)}
					onClick={() => handleFeedback("POSITIVE")}
					disabled={isLoading || submittedRating !== null}
					title="This was helpful"
				>
					<ThumbsUp className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 rounded-full transition-colors",
						submittedRating === "NEGATIVE" &&
							"bg-red-100 text-red-600 hover:bg-red-100",
						submittedRating === "POSITIVE" && "opacity-30",
					)}
					onClick={() => handleFeedback("NEGATIVE")}
					disabled={isLoading || submittedRating !== null}
					title="This wasn't helpful"
				>
					<ThumbsDown className="size-4" />
				</Button>
			</div>
		</div>
	);
}
