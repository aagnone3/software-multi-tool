"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

interface JobResultsUpgradeNudgeProps {
	organizationId?: string;
	className?: string;
}

/**
 * Inline upgrade nudge shown on the job detail page after a completed job.
 * Shows for free-plan users (Free→Pro) and Starter-plan users (Starter→Pro).
 * Zero render cost for Pro users.
 */
export function JobResultsUpgradeNudge({
	organizationId,
	className,
}: JobResultsUpgradeNudgeProps) {
	const { activePlan } = usePurchases(organizationId);
	const { track } = useProductAnalytics();

	const isFreePlan = activePlan?.id === "free";
	const isStarterPlan = activePlan?.id === "starter";
	const planId = activePlan?.id ?? "unknown";

	useEffect(() => {
		if (activePlan && (isFreePlan || isStarterPlan)) {
			track({
				name: "upgrade_nudge_shown",
				props: { source: "job_results_upgrade_nudge", plan_id: planId },
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activePlan?.id]);

	if (!activePlan || (!isFreePlan && !isStarterPlan)) {
		return null;
	}

	const billingHref = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

	if (isStarterPlan) {
		return (
			<div
				className={`rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-4 ${className ?? ""}`}
			>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
							<SparklesIcon className="size-4" />
						</div>
						<div>
							<p className="font-semibold text-sm">
								Ready for more?
							</p>
							<p className="mt-0.5 text-muted-foreground text-sm">
								Pro unlocks scheduled runs, bulk actions, and
								templates — so you can automate the work, not
								just do it once.
							</p>
						</div>
					</div>
					<div className="flex shrink-0 gap-2">
						<Button asChild variant="outline" size="sm">
							<Link
								href="#pricing-plan-pro"
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "job_results_upgrade_nudge",
											plan_id: planId,
											cta_label: "compare_plans",
										},
									})
								}
							>
								Compare plans
							</Link>
						</Button>
						<Button asChild size="sm">
							<Link
								href={`${billingHref}#pricing`}
								onClick={() =>
									track({
										name: "upgrade_nudge_cta_clicked",
										props: {
											source: "job_results_upgrade_nudge",
											plan_id: planId,
											cta_label: "upgrade_to_pro",
										},
									})
								}
							>
								Upgrade to Pro
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-4 ${className ?? ""}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
						<ZapIcon className="size-4" />
					</div>
					<div>
						<p className="font-semibold text-sm">
							Liked these results?
						</p>
						<p className="mt-0.5 text-muted-foreground text-sm">
							Free plan runs are limited. Upgrade to unlock more
							credits, rollover unused credits each month, and get
							priority processing.
						</p>
					</div>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button asChild size="sm">
						<Link
							href={`${billingHref}#pricing`}
							onClick={() =>
								track({
									name: "upgrade_nudge_cta_clicked",
									props: {
										source: "job_results_upgrade_nudge",
										plan_id: planId,
										cta_label: "upgrade",
									},
								})
							}
						>
							Upgrade
							<ArrowRightIcon className="ml-1.5 size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
