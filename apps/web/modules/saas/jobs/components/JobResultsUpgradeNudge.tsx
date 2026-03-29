"use client";

import { usePurchases } from "@saas/payments/hooks/purchases";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface JobResultsUpgradeNudgeProps {
	organizationId?: string;
	className?: string;
}

/**
 * Inline upgrade nudge shown on the job detail page after a completed job.
 * Only visible to free-plan users — zero render cost for paid users.
 */
export function JobResultsUpgradeNudge({
	organizationId,
	className,
}: JobResultsUpgradeNudgeProps) {
	const { activePlan } = usePurchases(organizationId);

	if (!activePlan || activePlan.id !== "free") {
		return null;
	}

	const billingHref = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

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
						<Link href={`${billingHref}#pricing`}>
							Upgrade
							<ArrowRightIcon className="ml-1.5 size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
