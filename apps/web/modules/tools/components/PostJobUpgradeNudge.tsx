"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { ArrowRightIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface PostJobUpgradeNudgeProps {
	className?: string;
}

/**
 * Shows a contextual upgrade nudge after a successful job completion
 * for users who are on the free plan or low on credits.
 * Displayed at the prime conversion moment: right after a user experiences value.
 */
export function PostJobUpgradeNudge({ className }: PostJobUpgradeNudgeProps) {
	const { balance, isLoading, isFreePlan, isStarterPlan, isLowCredits } =
		useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();
	const [show, setShow] = useState(false);

	// Billing path — org-scoped if applicable
	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	// Delay slightly so the nudge appears after the completion animation
	useEffect(() => {
		const timer = setTimeout(() => setShow(true), 600);
		return () => clearTimeout(timer);
	}, []);

	// Track nudge shown once it becomes visible
	const planId = isFreePlan ? "free" : isStarterPlan ? "starter" : "pro";
	useEffect(() => {
		if (
			show &&
			!isLoading &&
			(isFreePlan || isStarterPlan || isLowCredits)
		) {
			track({
				name: "upgrade_nudge_shown",
				props: {
					source: "post_job_upgrade_nudge",
					plan_id: planId,
					context:
						isLowCredits && !isFreePlan && !isStarterPlan
							? "low_credits"
							: undefined,
				},
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [show, isLoading]);

	// Only show for free/starter plan users or those low on credits
	if (
		isLoading ||
		(!isFreePlan && !isStarterPlan && !isLowCredits) ||
		!show
	) {
		return null;
	}

	const remaining = balance?.totalAvailable ?? 0;

	if (isFreePlan) {
		return (
			<aside
				className={cn(
					"mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4",
					className,
				)}
				aria-label="Upgrade prompt"
			>
				<div className="flex items-start gap-3">
					<div className="flex size-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
						<SparklesIcon className="size-4" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-sm">
							You're on the free plan
						</p>
						<p className="mt-0.5 text-muted-foreground text-sm">
							{remaining <= 3
								? `Only ${remaining} credit${remaining === 1 ? "" : "s"} left. Upgrade to keep going.`
								: "Upgrade to Pro for 500 credits/month, rollover, and priority processing."}
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<Link
								href={billingPath}
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "post_job_upgrade_nudge",
											plan_id: "free",
											cta_label: "upgrade_to_pro",
										},
									})
								}
							>
								<Button size="sm" className="gap-1.5">
									<ZapIcon className="size-3.5" />
									Upgrade to Pro
								</Button>
							</Link>
							<Link
								href={billingPath}
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "post_job_upgrade_nudge",
											plan_id: "free",
											cta_label: "view_plans",
										},
									})
								}
							>
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
								>
									View plans
									<ArrowRightIcon className="size-3.5" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</aside>
		);
	}

	if (isStarterPlan && !isLowCredits) {
		return (
			<aside
				className={cn(
					"mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4",
					className,
				)}
				aria-label="Starter upgrade prompt"
			>
				<div className="flex items-start gap-3">
					<div className="flex size-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
						<SparklesIcon className="size-4" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-sm">
							You're on the Starter plan
						</p>
						<p className="mt-0.5 text-muted-foreground text-sm">
							Upgrade to Pro for scheduled runs, bulk actions, and
							templates — everything you need to scale your
							workflow.
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<Link
								href={billingPath}
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "post_job_upgrade_nudge",
											plan_id: "starter",
											cta_label: "upgrade_to_pro",
										},
									})
								}
							>
								<Button size="sm" className="gap-1.5">
									<ZapIcon className="size-3.5" />
									Upgrade to Pro
								</Button>
							</Link>
							<Link
								href="/pricing#pricing-plan-pro"
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "post_job_upgrade_nudge",
											plan_id: "starter",
											cta_label: "compare_plans",
										},
									})
								}
							>
								<Button
									variant="outline"
									size="sm"
									className="gap-1.5"
								>
									Compare plans
									<ArrowRightIcon className="size-3.5" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</aside>
		);
	}

	// Low-credit nudge (not free plan — could buy more credits)
	return (
		<aside
			className={cn(
				"mt-4 rounded-lg border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20",
				className,
			)}
			aria-label="Low credits prompt"
		>
			<div className="flex items-start gap-3">
				<div className="flex size-8 flex-none items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
					<ZapIcon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
						Running low on credits
					</p>
					<p className="mt-0.5 text-amber-700 text-sm dark:text-amber-300">
						{remaining} credit{remaining === 1 ? "" : "s"} remaining
						this month. Top up to keep running tools.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Link
							href={billingPath}
							onClick={() =>
								track({
									name: "upgrade_nudge_cta_clicked",
									props: {
										source: "post_job_upgrade_nudge",
										plan_id: planId,
										cta_label: "buy_credits",
										context: "low_credits",
									},
								})
							}
						>
							<Button
								size="sm"
								className="gap-1.5 border-amber-400 bg-amber-500 text-white hover:bg-amber-600"
							>
								Buy credits
							</Button>
						</Link>
						<Link
							href={billingPath}
							onClick={() =>
								track({
									name: "upgrade_nudge_cta_clicked",
									props: {
										source: "post_job_upgrade_nudge",
										plan_id: planId,
										cta_label: "upgrade_plan",
										context: "low_credits",
									},
								})
							}
						>
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5"
							>
								Upgrade plan
								<ArrowRightIcon className="size-3.5" />
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</aside>
	);
}
