"use client";

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { Button } from "@ui/components/button";
import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export function StickyCta() {
	const [visible, setVisible] = useState(false);
	const [dismissed, setDismissed] = useState(false);
	const { isFreePlan, isLoading, balance } = useCreditsBalance();

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

	// Hide for authenticated Pro (paid) users only.
	// - Anonymous visitors: balance=undefined, isFreePlan=false → show CTA
	// - Free plan users: balance exists, isFreePlan=true → show CTA
	// - Pro users: balance exists, isFreePlan=false, !isLoading → hide CTA
	const isPaidUser = !isLoading && balance !== undefined && !isFreePlan;

	if (!visible || dismissed || isPaidUser) {
		return null;
	}

	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
			<div className="flex items-center gap-3 rounded-full border border-border/50 bg-background/95 px-5 py-3 shadow-lg backdrop-blur-sm">
				<p className="text-foreground text-sm font-medium whitespace-nowrap">
					Start free — 10 credits, no card needed
				</p>
				<Button size="sm" variant="primary" asChild>
					<Link href="/auth/signup">
						Get started
						<ArrowRightIcon className="ml-1.5 size-3.5" />
					</Link>
				</Button>
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
