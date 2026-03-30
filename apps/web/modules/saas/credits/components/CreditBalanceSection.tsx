"use client";

import { EmptyStateUpgradeNudge } from "@saas/shared/components/EmptyStateUpgradeNudge";
import React from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";
import { CreditBalanceCard } from "./CreditBalanceCard";

export function CreditBalanceSection() {
	const { balance, isLoading, isFreePlan } = useCreditsBalance();
	const isZeroCredits =
		!isLoading && balance !== undefined && balance.totalAvailable === 0;

	return (
		<div className="space-y-3">
			<CreditBalanceCard />
			{isFreePlan && isZeroCredits && (
				<EmptyStateUpgradeNudge context="credits" />
			)}
		</div>
	);
}
