"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface CreditPurchase {
	id: string;
	amount: number;
	description: string | null;
	createdAt: string;
}

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
	purchases: CreditPurchase[];
}

export function useCreditsBalance() {
	const query = useQuery(orpc.credits.balance.queryOptions({}));

	const balance = query.data as CreditBalance | undefined;

	// Calculate total credits (plan + purchased)
	const totalCredits = balance
		? balance.included + balance.purchasedCredits
		: 0;

	// Calculate percentage used against total credits
	const percentageUsed =
		balance && totalCredits > 0
			? Math.min(100, Math.round((balance.used / totalCredits) * 100))
			: 0;

	// Check if low on credits (less than 20% of total remaining)
	const isLowCredits =
		balance && totalCredits > 0
			? balance.totalAvailable / totalCredits < 0.2
			: false;

	return {
		balance,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		totalCredits,
		percentageUsed,
		isLowCredits,
		refetch: query.refetch,
	};
}
