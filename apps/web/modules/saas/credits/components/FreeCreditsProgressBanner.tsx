"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { CoinsIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

const FREE_DISMISS_KEY = "free-credits-banner-dismissed";
const STARTER_DISMISS_KEY = "starter-credits-banner-dismissed-until";

// --- Free plan helpers ---
function isFreeDissmissed(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	try {
		return localStorage.getItem(FREE_DISMISS_KEY) === "true";
	} catch {
		return false;
	}
}

function dismissFree(): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		localStorage.setItem(FREE_DISMISS_KEY, "true");
	} catch {
		// ignore
	}
}

// --- Starter plan helpers (dismiss for 24h to re-surface as usage accumulates) ---
function isStarterDismissed(): boolean {
	if (typeof window === "undefined") {
		return true;
	}
	try {
		return (
			Date.now() <
			Number(localStorage.getItem(STARTER_DISMISS_KEY) ?? "0")
		);
	} catch {
		return false;
	}
}

function dismissStarterFor24Hours(): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		localStorage.setItem(
			STARTER_DISMISS_KEY,
			String(Date.now() + 24 * 60 * 60 * 1000),
		);
	} catch {
		// ignore
	}
}

const COLORS = {
	low: {
		bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
		text: "text-blue-900 dark:text-blue-200",
		bar: "bg-blue-500",
		icon: "text-blue-500",
		btn: "border-blue-400 text-blue-800 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-900",
	},
	medium: {
		bg: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
		text: "text-amber-900 dark:text-amber-200",
		bar: "bg-amber-500",
		icon: "text-amber-500",
		btn: "border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900",
	},
	high: {
		bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
		text: "text-red-900 dark:text-red-200",
		bar: "bg-red-500",
		icon: "text-red-500",
		btn: "border-red-400 text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900",
	},
};

/**
 * Banner shown to free-plan users, displaying how many of their included
 * credits they've used. Also shown to Starter-plan users when they're ≥50%
 * through their monthly credits, with Pro-upgrade messaging.
 *
 * Disappears once dismissed or when the user upgrades to the appropriate plan.
 */
export function FreeCreditsProgressBanner() {
	const { balance, isLoading, isFreePlan, isStarterPlan } =
		useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	// Start hidden to avoid SSR flash; hydrate from localStorage in useEffect
	const [hidden, setHidden] = useState(true);

	useEffect(() => {
		if (isFreePlan) {
			setHidden(isFreeDissmissed());
		} else if (isStarterPlan) {
			setHidden(isStarterDismissed());
		}
	}, [isFreePlan, isStarterPlan]);

	if (isLoading || !balance || hidden) {
		return null;
	}

	const used = balance.used;
	const total = balance.included;
	const remaining = balance.remaining;
	const pctUsed = total > 0 ? Math.round((used / total) * 100) : 0;

	const billingHref = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	// --- Free plan banner ---
	if (isFreePlan) {
		// Show only when user has used at least 1 credit
		if (used === 0) {
			return null;
		}

		const urgencyLevel: "low" | "medium" | "high" =
			pctUsed >= 80 ? "high" : pctUsed >= 50 ? "medium" : "low";
		const c = COLORS[urgencyLevel];

		const message =
			urgencyLevel === "high"
				? remaining <= 0
					? "You've used all your free credits."
					: `Only ${remaining} free credit${remaining === 1 ? "" : "s"} left.`
				: urgencyLevel === "medium"
					? `You've used ${used} of your ${total} free credits.`
					: `${used} of ${total} free credits used.`;

		const handleDismiss = () => {
			dismissFree();
			setHidden(true);
		};

		return (
			<div
				className={`relative flex items-center gap-4 border-b px-4 py-2.5 text-sm ${c.bg} ${c.text}`}
			>
				<CoinsIcon className={`size-4 shrink-0 ${c.icon}`} />

				<div className="flex flex-1 items-center gap-3 min-w-0">
					<span className="shrink-0">{message}</span>
					<div className="hidden sm:flex flex-1 items-center gap-2 max-w-[160px]">
						<Progress
							value={pctUsed}
							className="h-1.5 bg-current/20"
						/>
						<span className="shrink-0 text-xs opacity-70">
							{pctUsed}%
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button
						asChild
						size="sm"
						variant="outline"
						className={`h-7 px-3 ${c.btn}`}
					>
						<Link href={billingHref}>Upgrade for more</Link>
					</Button>
					{urgencyLevel === "low" && (
						<button
							type="button"
							aria-label="Dismiss"
							onClick={handleDismiss}
							className={`${c.icon} hover:opacity-70`}
						>
							<XIcon className="size-4" />
						</button>
					)}
				</div>
			</div>
		);
	}

	// --- Starter plan banner (show at ≥50% usage to prompt Pro upgrade) ---
	if (isStarterPlan) {
		// Only surface when user is halfway through their credits
		if (pctUsed < 50) {
			return null;
		}

		const urgencyLevel: "medium" | "high" =
			pctUsed >= 80 ? "high" : "medium";
		const c = COLORS[urgencyLevel];

		const message =
			urgencyLevel === "high"
				? remaining <= 0
					? "You've used all your Starter credits — upgrade to Pro for 5× more."
					: `Only ${remaining} Starter credit${remaining === 1 ? "" : "s"} left. Pro gives you 500/month.`
				: `${remaining} of ${total} Starter credits remaining. Pro unlocks 500/month + scheduler.`;

		const handleDismiss = () => {
			dismissStarterFor24Hours();
			setHidden(true);
		};

		return (
			<div
				className={`relative flex items-center gap-4 border-b px-4 py-2.5 text-sm ${c.bg} ${c.text}`}
				data-testid="starter-credits-banner"
			>
				<CoinsIcon className={`size-4 shrink-0 ${c.icon}`} />

				<div className="flex flex-1 items-center gap-3 min-w-0">
					<span className="shrink-0">{message}</span>
					<div className="hidden sm:flex flex-1 items-center gap-2 max-w-[160px]">
						<Progress
							value={pctUsed}
							className="h-1.5 bg-current/20"
						/>
						<span className="shrink-0 text-xs opacity-70">
							{pctUsed}%
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button
						asChild
						size="sm"
						variant="outline"
						className={`h-7 px-3 ${c.btn}`}
					>
						<Link href={billingHref}>Upgrade to Pro</Link>
					</Button>
					<button
						type="button"
						aria-label="Dismiss"
						onClick={handleDismiss}
						className={`${c.icon} hover:opacity-70`}
					>
						<XIcon className="size-4" />
					</button>
				</div>
			</div>
		);
	}

	return null;
}
