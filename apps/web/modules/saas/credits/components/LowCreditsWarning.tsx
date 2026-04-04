"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

const ALERT_SETTINGS_KEY = "credit-alert-settings";

function getAlertSettings(): {
	enabled: boolean;
	threshold: number | null;
} {
	try {
		const stored = localStorage.getItem(ALERT_SETTINGS_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				enabled: parsed.enabled !== false,
				threshold:
					typeof parsed.threshold === "number" && parsed.threshold > 0
						? parsed.threshold
						: null,
			};
		}
	} catch {
		// ignore
	}
	// No saved settings — respect only proportional threshold
	return { enabled: true, threshold: null };
}

interface LowCreditsWarningProps {
	className?: string;
	threshold?: number;
	showActionButtons?: boolean;
}

export function LowCreditsWarning({
	className,
	threshold = 0.2,
	showActionButtons = true,
}: LowCreditsWarningProps) {
	const { balance, isLoading, isStarterPlan } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();
	const [alertSettings, setAlertSettings] = useState<{
		enabled: boolean;
		threshold: number | null;
	}>({ enabled: true, threshold: null });

	useEffect(() => {
		setAlertSettings(getAlertSettings());
	}, []);

	if (isLoading || !balance) {
		return null;
	}

	// Respect user-configured alert settings
	if (!alertSettings.enabled) {
		return null;
	}

	// Check absolute threshold from user settings OR the proportional threshold prop
	const totalCredits = balance.remaining + (balance.purchasedCredits ?? 0);
	const isLowAbsolute =
		alertSettings.threshold !== null &&
		totalCredits < alertSettings.threshold;
	const isLowProportional =
		balance.included > 0 &&
		balance.remaining / balance.included < threshold;
	const isLow = isLowAbsolute || isLowProportional;

	if (!isLow) {
		return null;
	}

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	return (
		<Alert
			variant="error"
			className={cn("flex items-start gap-3", className)}
		>
			<AlertTriangleIcon className="size-4" />
			<div className="flex-1">
				<AlertTitle>Low on credits</AlertTitle>
				<AlertDescription>
					You have {balance.remaining} credits remaining out of{" "}
					{balance.included} included in your {balance.plan.name}{" "}
					plan.
					{balance.purchasedCredits > 0 && (
						<span>
							{" "}
							Plus {balance.purchasedCredits} purchased credits
							available.
						</span>
					)}
				</AlertDescription>
			</div>
			{showActionButtons && (
				<div className="flex shrink-0 gap-2">
					{isStarterPlan ? (
						<>
							<Button asChild variant="secondary" size="sm">
								<Link
									href="/pricing#pricing-plan-pro"
									onClick={() =>
										track({
											name: "low_credits_warning_compare_plans_clicked",
											props: {},
										})
									}
								>
									Compare plans
								</Link>
							</Button>
							<Button asChild variant="primary" size="sm">
								<Link
									href={billingPath}
									onClick={() =>
										track({
											name: "low_credits_warning_upgrade_clicked",
											props: { plan: "starter" },
										})
									}
								>
									Upgrade to Pro
								</Link>
							</Button>
						</>
					) : (
						<>
							<Button asChild variant="secondary" size="sm">
								<Link
									href={billingPath}
									onClick={() =>
										track({
											name: "low_credits_warning_buy_credits_clicked",
											props: {},
										})
									}
								>
									Buy Credits
								</Link>
							</Button>
							<Button asChild variant="primary" size="sm">
								<Link
									href={billingPath}
									onClick={() =>
										track({
											name: "low_credits_warning_upgrade_clicked",
											props: { plan: "free" },
										})
									}
								>
									Upgrade Plan
								</Link>
							</Button>
						</>
					)}
				</div>
			)}
		</Alert>
	);
}
