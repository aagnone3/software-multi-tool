"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@ui/components/dialog";
import { ArrowRightIcon, CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY_FREE = "exit-intent-upgrade-shown";
const STORAGE_KEY_STARTER = "exit-intent-starter-to-pro-shown";
const COOLDOWN_DAYS = 3;

const FREE_PLAN_BENEFITS = [
	"Unlimited tool access — no credit limits",
	"Priority job processing (10× faster)",
	"Advanced export formats",
	"API access for automation",
];

const STARTER_TO_PRO_BENEFITS = [
	"500 credits/month (vs. 100 on Starter) + rollover",
	"Scheduler runs & bulk actions",
	"Reusable templates for repeat workflows",
	"Priority queue — get results faster",
];

function hasBeenShownRecently(key: string): boolean {
	if (typeof window === "undefined") { return true; }
	const raw = localStorage.getItem(key);
	if (!raw) { return false; }
	const ts = Number.parseInt(raw, 10);
	if (Number.isNaN(ts)) { return false; }
	const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
	return daysSince < COOLDOWN_DAYS;
}

function markShown(key: string): void {
	if (typeof window === "undefined") { return; }
	localStorage.setItem(key, String(Date.now()));
}

export function ExitIntentUpgradeModal() {
	const { isFreePlan, isStarterPlan, isLoading } = useCreditsBalance();
	const { track } = useProductAnalytics();
	const [open, setOpen] = useState(false);
	const triggeredRef = useRef(false);

	const isEligible = isFreePlan || isStarterPlan;
	const storageKey = isStarterPlan ? STORAGE_KEY_STARTER : STORAGE_KEY_FREE;

	const handleMouseLeave = useCallback(
		(e: MouseEvent) => {
			// Only trigger when cursor moves toward the top of the viewport (exiting via address bar / tab)
			if (e.clientY > 50) { return; }
			if (triggeredRef.current) { return; }
			if (!isEligible || isLoading) { return; }
			if (hasBeenShownRecently(storageKey)) { return; }

			triggeredRef.current = true;
			markShown(storageKey);
			setOpen(true);
			track({
				name: "exit_intent_modal_shown",
				props: {
					plan_id: isStarterPlan ? "starter" : "free",
					source: "exit_intent",
				},
			});
		},
		[isEligible, isLoading, storageKey],
	);

	useEffect(() => {
		if (isLoading || !isEligible) { return; }
		document.addEventListener("mouseleave", handleMouseLeave);
		return () => {
			document.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [isEligible, isLoading, handleMouseLeave]);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	const handleUpgradeClick = useCallback(() => {
		track({
			name: "upgrade_cta_clicked",
			props: {
				source: isStarterPlan
					? "exit_intent_starter_to_pro"
					: "exit_intent_free_to_paid",
				plan_id: isStarterPlan ? "starter" : "free",
				target_plan: isStarterPlan ? "pro" : "starter",
			},
		});
		handleClose();
	}, [track, isStarterPlan, handleClose]);

	const handleDismiss = useCallback(() => {
		track({
			name: "exit_intent_modal_dismissed",
			props: {
				plan_id: isStarterPlan ? "starter" : "free",
				source: "exit_intent",
			},
		});
		handleClose();
	}, [track, isStarterPlan, handleClose]);

	if (isLoading || !isEligible) { return null; }

	const benefits = isStarterPlan
		? STARTER_TO_PRO_BENEFITS
		: FREE_PLAN_BENEFITS;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-md p-0 overflow-hidden">
				{/* Header */}
				<div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-3 top-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
						onClick={handleClose}
						aria-label="Close"
					>
						<XIcon className="h-4 w-4" />
					</Button>

					<div className="flex items-center gap-2 mb-3">
						<SparklesIcon className="h-5 w-5" />
						<span className="text-sm font-medium uppercase tracking-wide opacity-90">
							Wait — before you go
						</span>
					</div>

					<DialogTitle className="text-2xl font-bold leading-tight mb-1">
						{isStarterPlan
							? "Ready to go further?"
							: "Unlock the full power"}
					</DialogTitle>
					<DialogDescription className="text-primary-foreground/80 text-sm">
						{isStarterPlan
							? "You're on Starter. Upgrade to Pro and unlock 5× more credits, scheduling, and bulk actions."
							: "You're on the free plan. Upgrade once, run anything — no credit anxiety."}
					</DialogDescription>
				</div>

				{/* Benefits */}
				<div className="p-6 space-y-4">
					<ul className="space-y-2">
						{benefits.map((benefit) => (
							<li
								key={benefit}
								className="flex items-start gap-2 text-sm"
							>
								<CheckIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
								<span>{benefit}</span>
							</li>
						))}
					</ul>

					<div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
						{isStarterPlan ? (
							<>
								Pro is{" "}
								<span className="font-semibold text-foreground">
									$29/month
								</span>{" "}
								— cancel anytime
							</>
						) : (
							<>
								Plans start at{" "}
								<span className="font-semibold text-foreground">
									$9/month
								</span>{" "}
								— cancel anytime
							</>
						)}
					</div>

					<div className="flex flex-col gap-2">
						<Button
							asChild
							className="w-full"
							onClick={handleUpgradeClick}
						>
							<Link href="/app/settings/billing">
								{isStarterPlan
									? "Upgrade to Pro"
									: "Upgrade now"}
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							className="w-full text-muted-foreground"
							onClick={handleDismiss}
						>
							{isStarterPlan
								? "No thanks, Starter is fine"
								: "No thanks, I'll stay on free"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
