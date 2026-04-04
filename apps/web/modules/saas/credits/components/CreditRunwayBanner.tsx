"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Button } from "@ui/components/button";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

const DISMISS_KEY = "credit-runway-banner-dismissed-until";

function getDismissedUntil(): number {
	if (typeof window === "undefined") {
		return 0;
	}
	try {
		return Number(localStorage.getItem(DISMISS_KEY) ?? "0");
	} catch {
		return 0;
	}
}

function dismissFor24Hours(): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		localStorage.setItem(
			DISMISS_KEY,
			String(Date.now() + 24 * 60 * 60 * 1000),
		);
	} catch {
		// ignore
	}
}

export function CreditRunwayBanner() {
	const {
		totalCredits,
		isLoading: balanceLoading,
		isStarterPlan,
	} = useCreditsBalance();
	const { jobs, isLoading: jobsLoading } = useJobsList(undefined, 50);
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();
	const [dismissed, setDismissed] = useState(true); // start dismissed until hydrated

	useEffect(() => {
		setDismissed(Date.now() < getDismissedUntil());
	}, []);

	const daysRemaining = useMemo(() => {
		if (
			balanceLoading ||
			jobsLoading ||
			totalCredits === undefined ||
			totalCredits === null
		) {
			return null;
		}

		const now = Date.now();
		const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
		const completedThisWeek = (jobs ?? []).filter((j) => {
			if (j.status !== "COMPLETED") {
				return false;
			}
			const created = j.createdAt
				? new Date(
						j.createdAt instanceof Date
							? j.createdAt
							: String(j.createdAt),
					).getTime()
				: 0;
			return created >= oneWeekAgo;
		});

		const creditsPerJob = 10;
		const weeklyCredits = completedThisWeek.length * creditsPerJob;
		const dailyBurnRate = weeklyCredits / 7;

		if (dailyBurnRate <= 0) {
			return null;
		}
		return totalCredits / dailyBurnRate;
	}, [jobs, totalCredits, balanceLoading, jobsLoading]);

	if (dismissed || daysRemaining === null || daysRemaining >= 3) {
		return null;
	}

	const billingHref = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const label =
		daysRemaining < 1
			? "less than a day"
			: daysRemaining < 2
				? "about 1 day"
				: "about 2 days";

	const handleDismiss = () => {
		dismissFor24Hours();
		setDismissed(true);
		track({ name: "credit_runway_banner_dismissed", props: {} });
	};

	return (
		<div className="relative flex items-center justify-between gap-3 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-b border-orange-200 dark:border-orange-800">
			<div className="flex items-center gap-2">
				<AlertTriangleIcon className="size-4 shrink-0 text-orange-500" />
				<span>
					{isStarterPlan ? (
						<>
							At your current pace, your credits will run out in{" "}
							<strong>{label}</strong>.{" "}
							<span className="text-orange-700 dark:text-orange-300">
								Pro gives you 5× more credits per month.
							</span>
						</>
					) : (
						<>
							At your current pace, your credits will run out in{" "}
							<strong>{label}</strong>.
						</>
					)}
				</span>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{isStarterPlan ? (
					<>
						<Button
							asChild
							size="sm"
							variant="outline"
							className="border-orange-400 text-orange-800 hover:bg-orange-100 dark:text-orange-200 dark:hover:bg-orange-900 h-7 px-3"
						>
							<Link
								href={billingHref}
								onClick={() =>
									track({
										name: "credit_runway_banner_upgrade_clicked",
										props: { plan: "starter" },
									})
								}
							>
								Upgrade to Pro
							</Link>
						</Button>
						<Button
							asChild
							size="sm"
							variant="ghost"
							className="text-orange-700 dark:text-orange-300 h-7 px-2"
						>
							<Link
								href="/pricing#pricing-plan-pro"
								onClick={() =>
									track({
										name: "credit_runway_banner_compare_plans_clicked",
										props: {},
									})
								}
							>
								Compare plans
							</Link>
						</Button>
					</>
				) : (
					<Button
						asChild
						size="sm"
						variant="outline"
						className="border-orange-400 text-orange-800 hover:bg-orange-100 dark:text-orange-200 dark:hover:bg-orange-900 h-7 px-3"
					>
						<Link
							href={billingHref}
							onClick={() =>
								track({
									name: "credit_runway_banner_buy_credits_clicked",
									props: {},
								})
							}
						>
							Buy Credits
						</Link>
					</Button>
				)}
				<button
					type="button"
					aria-label="Dismiss"
					onClick={handleDismiss}
					className="text-orange-500 hover:text-orange-700"
				>
					<XIcon className="size-4" />
				</button>
			</div>
		</div>
	);
}
