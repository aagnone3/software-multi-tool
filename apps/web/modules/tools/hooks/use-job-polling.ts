"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

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

	const invalidateJob = useCallback(() => {
		if (jobId) {
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.get.queryOptions({ input: { jobId } })
					.queryKey,
			});
		}
	}, [jobId, queryClient]);

	return {
		job: data?.job,
		isLoading,
		error,
		refetch,
		invalidateJob,
	};
}

export function useCreateJob() {
	const queryClient = useQueryClient();

	return useMutation({
		...orpc.jobs.create.mutationOptions(),
		onSuccess: () => {
			// Invalidate jobs list when a new job is created
			queryClient.invalidateQueries({
				queryKey: orpc.jobs.list.queryOptions({ input: {} }).queryKey,
			});
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
	});
}

export function useJobsList(toolSlug?: string) {
	const { data, isLoading, error, refetch } = useQuery({
		...orpc.jobs.list.queryOptions({
			input: { toolSlug },
		}),
	});

	return {
		jobs: data?.jobs ?? [],
		isLoading,
		error,
		refetch,
	};
}
