"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface Transaction {
	id: string;
	amount: number;
	type: "GRANT" | "USAGE" | "OVERAGE" | "REFUND" | "PURCHASE" | "ADJUSTMENT";
	toolSlug: string | null;
	jobId: string | null;
	description: string | null;
	createdAt: string;
}

export interface HistoryParams {
	limit?: number;
	offset?: number;
	toolSlug?: string;
	type?: "GRANT" | "USAGE" | "OVERAGE" | "REFUND" | "PURCHASE" | "ADJUSTMENT";
	startDate?: string;
	endDate?: string;
}

export interface HistoryResponse {
	transactions: Transaction[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

export function useCreditsHistory(params: HistoryParams = {}) {
	const query = useQuery(
		orpc.credits.history.queryOptions({ input: params }),
	);

	const data = query.data as HistoryResponse | undefined;

	return {
		transactions: data?.transactions ?? [],
		pagination: data?.pagination,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
