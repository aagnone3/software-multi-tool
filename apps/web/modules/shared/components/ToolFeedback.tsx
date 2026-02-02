"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ToolFeedbackProps {
	/** The tool slug (e.g., "news-analyzer", "speaker-separation") */
	toolSlug: string;
	/** Optional job ID to link feedback to a specific job */
	jobId?: string;
	/** "inline" = just the buttons, "card" = styled container (default: "card") */
	variant?: "inline" | "card";
	/** Additional class names */
	className?: string;
	/** Callback when feedback is submitted */
	onFeedbackSubmitted?: (rating: "POSITIVE" | "NEGATIVE") => void;
}

/**
 * Drop-in feedback component for tool result pages.
 *
 * @example
 * // Card variant (default) - includes styled container
 * <ToolFeedback toolSlug="news-analyzer" jobId={job.id} />
 *
 * @example
 * // Inline variant - just the feedback controls
 * <ToolFeedback toolSlug="news-analyzer" jobId={job.id} variant="inline" />
 */
export function ToolFeedback({
	toolSlug,
	jobId,
	variant = "card",
	className,
	onFeedbackSubmitted,
}: ToolFeedbackProps) {
	const [currentRating, setCurrentRating] = useState<
		"POSITIVE" | "NEGATIVE" | null
	>(null);
	const [feedbackId, setFeedbackId] = useState<string | null>(null);

	// Fetch existing feedback for this job
	const { data: existingFeedback, isLoading: isLoadingExisting } = useQuery({
		...orpc.feedback.getForJob.queryOptions({
			input: { jobId: jobId ?? "" },
		}),
		enabled: !!jobId,
	});

	// Initialize state from existing feedback
	useEffect(() => {
		if (existingFeedback?.feedback) {
			setCurrentRating(existingFeedback.feedback.rating);
			setFeedbackId(existingFeedback.feedback.id);
		}
	}, [existingFeedback]);

	const createMutation = useMutation(orpc.feedback.create.mutationOptions());
	const updateMutation = useMutation(orpc.feedback.update.mutationOptions());

	const handleFeedback = async (rating: "POSITIVE" | "NEGATIVE") => {
		// If clicking the same rating, do nothing
		if (currentRating === rating) {
			return;
		}

		try {
			if (feedbackId) {
				// Update existing feedback
				const result = await updateMutation.mutateAsync({
					feedbackId,
					rating,
				});
				setCurrentRating(rating);
				if (result.feedback) {
					setFeedbackId(result.feedback.id);
				}
				onFeedbackSubmitted?.(rating);
				toast.success("Feedback updated!");
			} else {
				// Create new feedback
				const result = await createMutation.mutateAsync({
					toolSlug,
					rating,
					jobId,
				});
				setCurrentRating(rating);
				setFeedbackId(result.feedback.id);
				onFeedbackSubmitted?.(rating);
				toast.success("Thank you for your feedback!");
			}
		} catch {
			toast.error("Failed to submit feedback. Please try again.");
		}
	};

	const isLoading =
		createMutation.isPending ||
		updateMutation.isPending ||
		isLoadingExisting;

	const feedbackControls = (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">
				Was this helpful?
			</span>
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 rounded-full transition-colors",
						currentRating === "POSITIVE" &&
							"bg-emerald-100 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
						currentRating === "NEGATIVE" && "opacity-30",
					)}
					onClick={() => handleFeedback("POSITIVE")}
					disabled={isLoading}
					title="This was helpful"
				>
					<ThumbsUp className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 rounded-full transition-colors",
						currentRating === "NEGATIVE" &&
							"bg-red-100 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
						currentRating === "POSITIVE" && "opacity-30",
					)}
					onClick={() => handleFeedback("NEGATIVE")}
					disabled={isLoading}
					title="This wasn't helpful"
				>
					<ThumbsDown className="size-4" />
				</Button>
			</div>
		</div>
	);

	if (variant === "inline") {
		return <div className={className}>{feedbackControls}</div>;
	}

	// Card variant - styled container
	return (
		<div
			className={cn(
				"rounded-lg border border-border/50 bg-muted/30 p-4",
				className,
			)}
		>
			{feedbackControls}
		</div>
	);
}
