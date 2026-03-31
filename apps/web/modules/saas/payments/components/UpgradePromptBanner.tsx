"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface UpgradePromptBannerProps {
	organizationId?: string;
	className?: string;
}

export function UpgradePromptBanner({
	organizationId,
	className,
}: UpgradePromptBannerProps) {
	const { activePlan } = usePurchases(organizationId);
	const { track } = useProductAnalytics();

	const handleUpgradeCtaClick = () => {
		track({
			name: "upgrade_cta_clicked",
			props: {
				source:
					activePlan?.id === "starter"
						? "starter_to_pro_upgrade_banner"
						: "upgrade_banner",
				plan_id: activePlan?.id ?? "free",
				target_plan: activePlan?.id === "starter" ? "pro" : "starter",
			},
		});
	};

	const handleComparePlansClick = () => {
		track({
			name: "upgrade_cta_clicked",
			props: {
				source: "starter_to_pro_compare_plans_banner",
				plan_id: activePlan?.id ?? "free",
				target_plan: "pro",
			},
		});
	};

	// Show upgrade prompts only for free/starter users
	if (
		!activePlan ||
		(activePlan.id !== "free" && activePlan.id !== "starter")
	) {
		return null;
	}

	const billingBase = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

	const isStarter = activePlan.id === "starter";

	return (
		<div
			className={`rounded-lg border border-primary/20 bg-primary/5 p-4 ${className ?? ""}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<SparklesIcon className="mt-0.5 size-5 shrink-0 text-primary" />
					<div>
						<p className="font-semibold text-sm">
							{isStarter
								? "You're on the Starter plan"
								: "You're on the Free plan"}
						</p>
						<p className="mt-0.5 text-muted-foreground text-sm">
							{isStarter
								? "Upgrade to Pro to unlock automation features like scheduler runs, bulk actions, and custom templates."
								: "Upgrade to Starter or Pro to unlock more credits, rollover unused credits, and priority support."}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 gap-2">
					{isStarter && (
						<Button asChild size="sm" variant="secondary">
							<Link
								href={`${billingBase}#pricing-plan-pro`}
								onClick={handleComparePlansClick}
							>
								Compare plans
							</Link>
						</Button>
					)}
					<Button asChild size="sm">
						<Link
							href={`${billingBase}#pricing`}
							onClick={handleUpgradeCtaClick}
						>
							{isStarter ? "Unlock Pro" : "Upgrade now"}
							<ArrowRightIcon className="ml-1.5 size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
