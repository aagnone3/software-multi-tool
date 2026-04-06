"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export function StickyCta() {
	const [visible, setVisible] = useState(false);
	const [dismissed, setDismissed] = useState(false);
	const { isFreePlan, isStarterPlan, isLoading, balance } =
		useCreditsBalance();
	const { track } = useProductAnalytics();

	const handleCtaClick = () => {
		track({
			name: "upgrade_cta_clicked",
			props: {
				source: "sticky_cta",
				plan_id: balance?.plan.id ?? "anonymous",
			},
		});
	};

	useEffect(() => {
		// Show after user scrolls past ~400px (past the hero fold)
		const handleScroll = () => {
			if (!dismissed) {
				setVisible(window.scrollY > 400);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [dismissed]);

	const handleDismiss = () => {
		setDismissed(true);
		setVisible(false);
	};

	// Determine what to show:
	// - Anonymous / free plan → "Start free" CTA
	// - Starter plan → Starter→Pro upsell CTA
	// - Pro (paid, not free, not starter) → hide entirely
	const isProUser =
		!isLoading && balance !== undefined && !isFreePlan && !isStarterPlan;

	if (!visible || dismissed || isProUser) {
		return null;
	}

	const isStarter = !isLoading && balance !== undefined && isStarterPlan;

	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
			<div className="flex items-center gap-3 rounded-full border border-border/50 bg-background/95 px-5 py-3 shadow-lg backdrop-blur-sm">
				{isStarter ? (
					<>
						<p className="text-foreground text-sm font-medium whitespace-nowrap">
							Unlock scheduler, bulk actions &amp; more
						</p>
						<Button size="sm" variant="primary" asChild>
							<Link
								href="/app/settings/billing?upgrade=pro"
								onClick={handleCtaClick}
							>
								Upgrade to Pro
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					</>
				) : (
					<>
						<p className="text-foreground text-sm font-medium whitespace-nowrap">
							Start free — 10 credits, no card needed
						</p>
						<Button size="sm" variant="primary" asChild>
							<Link href="/auth/signup" onClick={handleCtaClick}>
								Get started
								<ArrowRightIcon className="ml-1.5 size-3.5" />
							</Link>
						</Button>
					</>
				)}
				<button
					type="button"
					onClick={handleDismiss}
					aria-label="Dismiss"
					className="ml-1 text-foreground/40 hover:text-foreground/70 transition-colors"
				>
					<XIcon className="size-4" />
				</button>
			</div>
		</div>
	);
}
