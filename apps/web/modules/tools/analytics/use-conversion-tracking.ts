"use client";

import { useAnalytics } from "@analytics";
import { useCallback } from "react";

const SESSION_ID_KEY = "tool_analytics_session_id";

/**
 * Get session ID from localStorage
 */
function getSessionId(): string | undefined {
	if (typeof window === "undefined") {
		return undefined;
	}
	return localStorage.getItem(SESSION_ID_KEY) ?? undefined;
}

interface UseConversionTrackingReturn {
	/** Track when user starts credit purchase flow */
	trackCreditsPurchaseStarted: (properties?: {
		creditPackage?: string;
		priceCents?: number;
		toolName?: string;
	}) => void;
	/** Track when credit purchase is completed */
	trackCreditsPurchaseCompleted: (properties?: {
		creditPackage?: string;
		creditsAmount?: number;
		priceCents?: number;
		toolName?: string;
	}) => void;
	/** Track when anonymous user creates account from tool */
	trackAccountCreatedFromTool: (properties?: {
		signupMethod?: "email" | "google" | "github";
		toolName?: string;
	}) => void;
}

/**
 * Hook for tracking conversion events
 *
 * Tracks important conversion funnel events:
 * - Credit purchase flow
 * - Account creation from tool usage (anonymous -> authenticated)
 *
 * @example
 * ```tsx
 * function CreditsPurchaseButton({ toolName }: { toolName: string }) {
 *   const { trackCreditsPurchaseStarted } = useConversionTracking();
 *
 *   const handleClick = () => {
 *     trackCreditsPurchaseStarted({ toolName, creditPackage: "basic", priceCents: 499 });
 *     // Navigate to checkout...
 *   };
 *
 *   return <button onClick={handleClick}>Buy Credits</button>;
 * }
 * ```
 */
export function useConversionTracking(): UseConversionTrackingReturn {
	const { trackEvent } = useAnalytics();

	const trackCreditsPurchaseStarted = useCallback(
		(properties?: {
			creditPackage?: string;
			priceCents?: number;
			toolName?: string;
		}) => {
			trackEvent("credits_purchase_started", {
				session_id: getSessionId(),
				credit_package: properties?.creditPackage,
				price_cents: properties?.priceCents,
				tool_name: properties?.toolName,
			});
		},
		[trackEvent],
	);

	const trackCreditsPurchaseCompleted = useCallback(
		(properties?: {
			creditPackage?: string;
			creditsAmount?: number;
			priceCents?: number;
			toolName?: string;
		}) => {
			trackEvent("credits_purchase_completed", {
				session_id: getSessionId(),
				credit_package: properties?.creditPackage,
				credits_amount: properties?.creditsAmount,
				price_cents: properties?.priceCents,
				tool_name: properties?.toolName,
			});
		},
		[trackEvent],
	);

	const trackAccountCreatedFromTool = useCallback(
		(properties?: {
			signupMethod?: "email" | "google" | "github";
			toolName?: string;
		}) => {
			const previousSessionId = getSessionId();

			trackEvent("account_created_from_tool", {
				previous_session_id: previousSessionId,
				signup_method: properties?.signupMethod,
				tool_name: properties?.toolName,
			});
		},
		[trackEvent],
	);

	return {
		trackCreditsPurchaseStarted,
		trackCreditsPurchaseCompleted,
		trackAccountCreatedFromTool,
	};
}
