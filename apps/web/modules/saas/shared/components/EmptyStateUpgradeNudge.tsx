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

type CopyEntry = { headline: string; body: string; cta: string };

const FREE_COPY: Record<
	NonNullable<EmptyStateUpgradeNudgeProps["context"]>,
	CopyEntry
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

const STARTER_COPY: Record<
	NonNullable<EmptyStateUpgradeNudgeProps["context"]>,
	CopyEntry
> = {
	jobs: {
		headline: "Unlock Pro for more power",
		body: "You're on Starter (100 credits/month). Upgrade to Pro for 500 credits, scheduler runs, bulk actions, and advanced templates.",
		cta: "Upgrade to Pro",
	},
	tool: {
		headline: "Need more runs? Go Pro",
		body: "Pro gives you 500 credits/month, scheduled runs, and bulk processing — 5× more than Starter.",
		cta: "Upgrade to Pro",
	},
	credits: {
		headline: "You've used all your Starter credits",
		body: "Upgrade to Pro to get 500 credits/month, rollover unused credits, and priority processing — starting at $29/mo.",
		cta: "Upgrade to Pro",
	},
};

/**
 * Subtle upgrade nudge rendered inside empty states (no jobs yet, no tool runs, out of credits).
 * Visible to free users (Free→Starter/Pro) and starter users (Starter→Pro).
 * Zero render cost for Pro users.
 */
export function EmptyStateUpgradeNudge({
	organizationId,
	context = "jobs",
	className,
}: EmptyStateUpgradeNudgeProps) {
	const { activePlan } = usePurchases(organizationId);

	const isFree = activePlan?.id === "free";
	const isStarter = activePlan?.id === "starter";

	if (!isFree && !isStarter) {
		return null;
	}

	const billingHref = organizationId
		? `/app/orgs/${organizationId}/settings/billing`
		: "/app/settings/billing";

	const copy = isStarter ? STARTER_COPY[context] : FREE_COPY[context];

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
					{isFree && (
						<Button asChild size="sm">
							<Link href={`${billingHref}#pricing`}>
								Start free trial
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					)}
					{isStarter && (
						<Button asChild size="sm">
							<Link href={`${billingHref}#pricing-plan-pro`}>
								Compare plans
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
