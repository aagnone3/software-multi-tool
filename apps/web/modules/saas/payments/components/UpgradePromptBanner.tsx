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

	const handleCtaClick = () => {
		track({
			name: "upgrade_cta_clicked",
			props: {
				source: "upgrade_banner",
				plan_id: activePlan?.id ?? "free",
			},
		});
	};

	// Only show for free plan users
	if (!activePlan || activePlan.id !== "free") {
		return null;
	}

	const billingBase = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

	return (
		<div
			className={`rounded-lg border border-primary/20 bg-primary/5 p-4 ${className ?? ""}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<SparklesIcon className="mt-0.5 size-5 shrink-0 text-primary" />
					<div>
						<p className="font-semibold text-sm">
							You're on the Free plan
						</p>
						<p className="mt-0.5 text-muted-foreground text-sm">
							Upgrade to Starter or Pro to unlock more credits,
							rollover unused credits, and priority support.
						</p>
					</div>
				</div>
				<Button asChild size="sm" className="shrink-0">
					<Link
						href={`${billingBase}#pricing`}
						onClick={handleCtaClick}
					>
						Upgrade now
						<ArrowRightIcon className="ml-1.5 size-3.5" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
