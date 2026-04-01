"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const POLLING_INTERVALS = {
	PROCESSING: 2000, // Poll every 2 seconds while processing
	PENDING: 5000, // Poll every 5 seconds while pending
	COMPLETED: false, // Stop polling when completed
	FAILED: false, // Stop polling when failed
	CANCELLED: false, // Stop polling when cancelled
} as const;

type JobStatus = keyof typeof POLLING_INTERVALS;

function getPollingInterval(status: JobStatus | undefined): number | false {
	if (!status) {
		return 2000; // Default to 2 seconds if status unknown
	}
	return POLLING_INTERVALS[status] ?? false;
}

export function useJobPolling(jobId: string | undefined) {
	const queryClient = useQueryClient();
	const { track } = useProductAnalytics();
	const { balance } = useCreditsBalance();
	const planId = balance?.plan.id ?? "free";
	const prevStatusRef = useRef<string | undefined>(undefined);

	const { data, isLoading, error, refetch } = useQuery({
		...orpc.jobs.get.queryOptions({
			input: { jobId: jobId ?? "" },
		}),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.job?.status as
				| JobStatus
				| undefined;
			return getPollingInterval(status);
		},
		refetchIntervalInBackground: false,
	});

	const job = data?.job;

	// Track status transitions
	useEffect(() => {
		if (!job) {
			return;
		}
		const status = job.status as string;
		if (status === prevStatusRef.current) {
			return;
		}

		const toolSlug = (job as { toolSlug?: string }).toolSlug ?? "unknown";

		if (status === "COMPLETED") {
			const createdAt = (job as { createdAt?: string | Date }).createdAt;
			const completedAt = (job as { completedAt?: string | Date })
				.completedAt;
			const durationMs =
				createdAt && completedAt
					? new Date(completedAt).getTime() -
						new Date(createdAt).getTime()
					: 0;
			track({
				name: "tool_run_completed",
				props: {
					tool_slug: toolSlug,
					plan_id: planId,
					duration_ms: durationMs,
					success: true,
				},
			});
		} else if (status === "FAILED") {
			const errorMsg = (job as { error?: string | null }).error;
			track({
				name: "tool_run_failed",
				props: {
					tool_slug: toolSlug,
					plan_id: planId,
					error_code: errorMsg ?? undefined,
				},
			});
		}

		prevStatusRef.current = status;
	}, [job, track, planId]);

	const invalidateJob = useCallback(() => {
		if (jobId) {
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.get.queryOptions({ input: { jobId } })
					.queryKey,
			});
		}
	}, [jobId, queryClient]);

	return {
		job,
		isLoading,
		error,
		refetch,
		invalidateJob,
	};
}

export function useCreateJob() {
	const queryClient = useQueryClient();
	const { track } = useProductAnalytics();
	const { balance } = useCreditsBalance();
	const planId = balance?.plan.id ?? "free";

	return useMutation({
		...orpc.jobs.create.mutationOptions(),
		onSuccess: (data) => {
			// Invalidate jobs list when a new job is created
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.list.queryOptions({ input: {} }).queryKey,
			});

			const toolSlug =
				(data as { job?: { toolSlug?: string } })?.job?.toolSlug ??
				"unknown";
			track({
				name: "tool_run_started",
				props: { tool_slug: toolSlug, plan_id: planId },
			});
		},
		onError: () => {
			toast.error("Failed to start job. Please try again.");
		},
	});
}

export function useCancelJob() {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.jobs.cancel.mutationOptions(),
		onSuccess: (_, variables) => {
			// Invalidate the specific job and jobs list
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.get.queryOptions({
					input: { jobId: variables.jobId },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.list.queryOptions({ input: {} }).queryKey,
			});
		},
		onError: () => {
			toast.error("Failed to cancel job. Please try again.");
		},
	});
}

export function useJobsList(toolSlug?: string, limit?: number) {
	const { data, isLoading, error, refetch } = useQuery({
		...orpc.jobs.list.queryOptions({
			input: { toolSlug, limit },
		}),
	});

	return {
		jobs: data?.jobs ?? [],
		isLoading,
		error,
		refetch,
	};
}

export function useJobsListPaginated({
	toolSlug,
	limit = 20,
	offset = 0,
}: {
	toolSlug?: string;
	limit?: number;
	offset?: number;
}) {
	const { data, isLoading, error, refetch } = useQuery({
		...orpc.jobs.list.queryOptions({
			input: { toolSlug, limit, offset },
		}),
	});

	return {
		jobs: data?.jobs ?? [],
		isLoading,
		error,
		refetch,
		hasMore: (data?.jobs?.length ?? 0) === limit,
	};
}
