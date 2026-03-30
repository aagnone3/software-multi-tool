"use client";

import { usePurchases } from "@saas/payments/hooks/purchases";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, RocketIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface EmptyStateUpgradeNudgeProps {
	organizationId?: string;
	/**
	 * Context hint that changes the copy shown.
	 * - "jobs"   → "You haven't run any jobs yet. Upgrade to unlock more credits and run more tools."
	 * - "tool"   → "No runs yet. Upgrade to get more credits and try this tool more often."
	 * - "credits" → "You're out of credits. Upgrade to keep going."
	 */
	context?: "jobs" | "tool" | "credits";
	className?: string;
}

const COPY: Record<
	NonNullable<EmptyStateUpgradeNudgeProps["context"]>,
	{ headline: string; body: string; cta: string }
> = {
	jobs: {
		headline: "Start running tools — get more with Pro",
		body: "Free plan includes 10 credits/month. Upgrade to Starter or Pro for 100–500 credits, rollover unused credits, and priority processing.",
		cta: "See plans",
	},
	tool: {
		headline: "Run this tool more with Pro",
		body: "Free plan credits go fast. Upgrade to get 10–50× more credits, rollover unused credits each month, and priority queue access.",
		cta: "Upgrade now",
	},
	credits: {
		headline: "You've used all your credits",
		body: "Upgrade to restore your credits immediately and get 10–50× more each month — plus rollover so you never lose unused credits.",
		cta: "Upgrade now",
	},
};

/**
 * Subtle upgrade nudge rendered inside empty states (no jobs yet, no tool runs, out of credits).
 * Only visible to free-plan users — zero render cost for paid users.
 */
export function EmptyStateUpgradeNudge({
	organizationId,
	context = "jobs",
	className,
}: EmptyStateUpgradeNudgeProps) {
	const { activePlan } = usePurchases(organizationId);

	if (!activePlan || activePlan.id !== "free") {
		return null;
	}

	const billingHref = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

	const copy = COPY[context];

	return (
		<div
			className={`rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 mt-4 ${className ?? ""}`}
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
						{context === "credits" ? (
							<ZapIcon className="size-4" />
						) : (
							<RocketIcon className="size-4" />
						)}
					</div>
					<div>
						<p className="font-semibold text-sm">{copy.headline}</p>
						<p className="mt-0.5 text-muted-foreground text-sm max-w-md">
							{copy.body}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button asChild size="sm" variant="outline">
						<Link href={billingHref}>{copy.cta}</Link>
					</Button>
					<Button asChild size="sm">
						<Link href={`${billingHref}#pricing`}>
							Start free trial
							<ArrowRightIcon className="ml-1.5 size-3.5" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
