"use client";

import { StickyCta } from "@marketing/home/components/StickyCta";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import React from "react";

/**
 * Blog-page sticky CTA wrapper.
 *
 * Renders the upgrade/trial sticky banner only for anonymous and free-plan
 * users. Paid (Pro) users already subscribed have no need for the CTA and
 * seeing it creates unnecessary friction.
 *
 * Note: `isLoading` resolves to false for unauthenticated visitors because
 * the credits query is disabled when there is no active organization, so the
 * CTA renders immediately for anonymous users without a loading flash.
 */
export function BlogStickyCta() {
	const { balance, isFreePlan, isLoading } = useCreditsBalance();

	// isPro = query settled AND plan data exists AND user is not on free plan
	const isPro = !isLoading && balance !== undefined && !isFreePlan;

	if (isPro) {
		return null;
	}

	return <StickyCta />;
}
