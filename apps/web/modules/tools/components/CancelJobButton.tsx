"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui/components/alert-dialog";
import { Button } from "@ui/components/button";
import { XCircle } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface CancelJobButtonProps {
	jobId: string;
	toolSlug: string;
	/** Optional callback fired after the cancel succeeds, e.g. to refetch the table. */
	onCancelled?: () => void;
}

/**
 * Inline cancel button for PENDING tool jobs. Opens a confirmation dialog,
 * calls the cancelJob procedure (which refunds the up-front credit), and
 * invokes `onCancelled` on success so the host table can refetch.
 *
 * Only renders for PENDING jobs — the backend rejects cancels for any
 * other status. The host is expected to gate rendering accordingly.
 */
export function CancelJobButton({
	jobId,
	toolSlug,
	onCancelled,
}: CancelJobButtonProps) {
	const [open, setOpen] = useState(false);
	const { track } = useProductAnalytics();

	const cancelMutation = useMutation({
		...orpc.jobs.cancel.mutationOptions(),
		onSuccess: () => {
			track({
				name: "job_cancel_succeeded",
				props: { job_id: jobId, tool_slug: toolSlug },
			});
			toast.success("Job cancelled. Credit refunded.");
			onCancelled?.();
			setOpen(false);
		},
		onError: (error) => {
			track({
				name: "job_cancel_failed",
				props: { job_id: jobId, tool_slug: toolSlug },
			});
			toast.error(
				error instanceof Error
					? error.message
					: "Could not cancel the job. Please try again.",
			);
		},
	});

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-muted-foreground hover:text-destructive"
					onClick={(e) => {
						e.stopPropagation();
						track({
							name: "job_cancel_clicked",
							props: { job_id: jobId, tool_slug: toolSlug },
						});
					}}
				>
					<XCircle className="mr-1 size-4" />
					Cancel
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent onClick={(e) => e.stopPropagation()}>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel this analysis?</AlertDialogTitle>
					<AlertDialogDescription>
						The job will be cancelled and any credit deducted for it
						will be refunded to your balance. You can submit a new
						analysis any time.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={cancelMutation.isPending}>
						Keep job
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={cancelMutation.isPending}
						onClick={(e) => {
							e.preventDefault();
							cancelMutation.mutate({ jobId });
						}}
					>
						{cancelMutation.isPending
							? "Cancelling…"
							: "Cancel job"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
