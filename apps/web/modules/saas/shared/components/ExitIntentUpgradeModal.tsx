"use client";

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

const STORAGE_KEY = "exit-intent-upgrade-shown";
const COOLDOWN_DAYS = 3;

const UPGRADE_BENEFITS = [
	"Unlimited tool access — no credit limits",
	"Priority job processing (10× faster)",
	"Advanced export formats",
	"API access for automation",
];

function hasBeenShownRecently(): boolean {
	if (typeof window === "undefined") return true;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return false;
	const ts = Number.parseInt(raw, 10);
	if (Number.isNaN(ts)) return false;
	const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
	return daysSince < COOLDOWN_DAYS;
}

function markShown(): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function ExitIntentUpgradeModal() {
	const { isFreePlan, isLoading } = useCreditsBalance();
	const [open, setOpen] = useState(false);
	const triggeredRef = useRef(false);

	const handleMouseLeave = useCallback(
		(e: MouseEvent) => {
			// Only trigger when cursor moves toward the top of the viewport (exiting via address bar / tab)
			if (e.clientY > 50) return;
			if (triggeredRef.current) return;
			if (!isFreePlan || isLoading) return;
			if (hasBeenShownRecently()) return;

			triggeredRef.current = true;
			markShown();
			setOpen(true);
		},
		[isFreePlan, isLoading],
	);

	useEffect(() => {
		if (isLoading || !isFreePlan) return;
		document.addEventListener("mouseleave", handleMouseLeave);
		return () => {
			document.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [isFreePlan, isLoading, handleMouseLeave]);

	const handleClose = useCallback(() => {
		setOpen(false);
	}, []);

	if (isLoading || !isFreePlan) return null;

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
						Unlock the full power
					</DialogTitle>
					<DialogDescription className="text-primary-foreground/80 text-sm">
						You&apos;re on the free plan. Upgrade once, run anything
						— no credit anxiety.
					</DialogDescription>
				</div>

				{/* Benefits */}
				<div className="p-6 space-y-4">
					<ul className="space-y-2">
						{UPGRADE_BENEFITS.map((benefit) => (
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
						Plans start at{" "}
						<span className="font-semibold text-foreground">
							$9/month
						</span>{" "}
						— cancel anytime
					</div>

					<div className="flex flex-col gap-2">
						<Button
							asChild
							className="w-full"
							onClick={handleClose}
						>
							<Link href="/app/settings/billing">
								Upgrade now
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							className="w-full text-muted-foreground"
							onClick={handleClose}
						>
							No thanks, I&apos;ll stay on free
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
