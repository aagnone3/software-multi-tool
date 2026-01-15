"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface ToolUsage {
	toolSlug: string;
	credits: number;
	count: number;
}

export interface PeriodUsage {
	date: string;
	credits: number;
}

export interface UsageStatsParams {
	period?: "day" | "week" | "month";
	startDate?: string;
	endDate?: string;
}

export interface UsageStatsResponse {
	totalUsed: number;
	totalOverage: number;
	byTool: ToolUsage[];
	byPeriod: PeriodUsage[];
}

export function useUsageStats(params: UsageStatsParams = {}) {
	const query = useQuery(
		orpc.credits.usageStats.queryOptions({ input: params }),
	);

	const data = query.data as UsageStatsResponse | undefined;

	// Get most used tool
	const mostUsedTool =
		data?.byTool && data.byTool.length > 0
			? data.byTool.reduce((max, tool) =>
					tool.credits > max.credits ? tool : max,
				)
			: null;

	// Calculate total operations
	const totalOperations =
		data?.byTool?.reduce((sum, tool) => sum + tool.count, 0) ?? 0;

	return {
		stats: data,
		totalUsed: data?.totalUsed ?? 0,
		totalOverage: data?.totalOverage ?? 0,
		byTool: data?.byTool ?? [],
		byPeriod: data?.byPeriod ?? [],
		mostUsedTool,
		totalOperations,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
