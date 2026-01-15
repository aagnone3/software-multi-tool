"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface CreditBalance {
	included: number;
	used: number;
	remaining: number;
	overage: number;
	purchasedCredits: number;
	totalAvailable: number;
	periodStart: string;
	periodEnd: string;
	plan: {
		id: string;
		name: string;
	};
}

export function useCreditsBalance() {
	const query = useQuery(orpc.credits.balance.queryOptions({}));

	const balance = query.data as CreditBalance | undefined;

	// Calculate percentage used
	const percentageUsed = balance
		? Math.min(100, Math.round((balance.used / balance.included) * 100))
		: 0;

	// Check if low on credits (less than 20% remaining)
	const isLowCredits =
		balance && balance.included > 0
			? balance.remaining / balance.included < 0.2
			: false;

	return {
		balance,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		percentageUsed,
		isLowCredits,
		refetch: query.refetch,
	};
}
