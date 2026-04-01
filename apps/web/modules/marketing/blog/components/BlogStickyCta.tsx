"use client";

import { StickyCta } from "@marketing/home/components/StickyCta";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import React from "react";

/**
 * Blog-page sticky CTA wrapper.
 *
 * - Anonymous / free plan users → "Start free" sticky CTA
 * - Starter plan users → Starter→Pro upgrade sticky CTA
 * - Pro users → hidden (already subscribed; unnecessary friction)
 *
 * Note: `isLoading` resolves to false for unauthenticated visitors because
 * the credits query is disabled when there is no active organization, so the
 * CTA renders immediately for anonymous users without a loading flash.
 */
export function BlogStickyCta() {
	const { balance, isFreePlan, isStarterPlan, isLoading } =
		useCreditsBalance();

	// isPro = query settled AND plan data exists AND user is not on free plan AND not on starter plan
	const isPro =
		!isLoading && balance !== undefined && !isFreePlan && !isStarterPlan;

	if (isPro) {
		return null;
	}

	return <StickyCta />;
}
