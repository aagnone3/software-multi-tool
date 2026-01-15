"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface Job {
	id: string;
	toolSlug: string;
	status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
	createdAt: string;
	completedAt: string | null;
}

interface JobsResponse {
	jobs: Job[];
}

export function useRecentJobs(limit = 5) {
	const query = useQuery(
		orpc.jobs.list.queryOptions({ input: { limit, offset: 0 } })
	);

	const data = query.data as JobsResponse | undefined;

	// Group by unique tools (most recent first)
	const recentToolSlugs = data?.jobs
		? [...new Set(data.jobs.map((job) => job.toolSlug))]
		: [];

	// Get the most recent job for each tool
	const recentToolsMap = new Map<string, Job>();
	for (const job of data?.jobs ?? []) {
		if (!recentToolsMap.has(job.toolSlug)) {
			recentToolsMap.set(job.toolSlug, job);
		}
	}

	return {
		jobs: data?.jobs ?? [],
		recentToolSlugs,
		recentToolsMap,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
