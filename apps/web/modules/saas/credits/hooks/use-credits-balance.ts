"use client";

import {
	type ApiErrorCode,
	classifyError,
	isApiInitializing,
} from "@shared/lib/api-error-utils";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "../../organizations/hooks/use-active-organization";

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
	const { activeOrganization } = useActiveOrganization();

	// Skip the API call when no organization is set to prevent 400 errors.
	// This is expected when the user is not on an organization-scoped route (e.g., /app/settings).
	const hasActiveOrganization = !!activeOrganization;

	const query = useQuery({
		...orpc.credits.balance.queryOptions({}),
		enabled: hasActiveOrganization,
	});

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

	// Classify the error for UI handling
	const errorCode: ApiErrorCode | undefined = query.error
		? classifyError(query.error)
		: undefined;

	// Check if API is still initializing (preview environments)
	const apiInitializing = query.error
		? isApiInitializing(query.error)
		: false;

	return {
		balance,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		errorCode,
		isApiInitializing: apiInitializing,
		totalCredits,
		percentageUsed,
		isLowCredits,
		hasActiveOrganization,
		refetch: query.refetch,
	};
}
