"use client";

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { X } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "exit_intent_dismissed";
const DISMISS_DAYS = 7;

export function ExitIntentModal() {
	const [visible, setVisible] = useState(false);
	const triggered = useRef(false);
	const { isFreePlan, isLoading, balance } = useCreditsBalance();

	// Hide for authenticated Pro (paid) users only.
	// - Anonymous visitors: balance=undefined, isFreePlan=false → show modal
	// - Free plan users: balance exists, isFreePlan=true → show modal
	// - Pro users: balance exists, isFreePlan=false, !isLoading → hide modal
	const isPaidUser = !isLoading && balance !== undefined && !isFreePlan;

	const dismiss = useCallback(() => {
		setVisible(false);
		const expires = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
		localStorage.setItem(STORAGE_KEY, String(expires));
	}, []);

	useEffect(() => {
		if (isPaidUser) return;

		const suppressed = localStorage.getItem(STORAGE_KEY);
		if (suppressed && Date.now() < Number(suppressed)) return;

		const handleMouseLeave = (e: MouseEvent) => {
			if (triggered.current) return;
			if (e.clientY <= 10) {
				triggered.current = true;
				setVisible(true);
			}
		};

		document.addEventListener("mouseleave", handleMouseLeave);
		return () =>
			document.removeEventListener("mouseleave", handleMouseLeave);
	}, [isPaidUser]);

	if (isPaidUser) return null;
	if (!visible) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Special offer"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) dismiss();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") dismiss();
			}}
		>
			<div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
				<button
					type="button"
					onClick={dismiss}
					aria-label="Close"
					className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
				>
					<X className="h-5 w-5" />
				</button>

				<div className="text-center">
					<div className="mb-2 text-4xl">🎁</div>
					<h2 className="mb-2 font-bold text-2xl text-foreground">
						Wait — before you go
					</h2>
					<p className="mb-4 text-muted-foreground text-sm leading-relaxed">
						Get <strong>10 free AI credits</strong> just for signing
						up. No credit card. No commitment. Use them to summarize
						a meeting, analyze a contract, or process an invoice —
						free.
					</p>

					<div className="mb-4 rounded-lg bg-primary/10 px-4 py-3 text-primary text-sm font-medium">
						✓ 10 free credits — no card required
					</div>

					<Link
						href="/auth/signup"
						onClick={dismiss}
						className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm shadow hover:bg-primary/90 transition-colors"
					>
						Claim my free credits →
					</Link>
					<button
						type="button"
						onClick={dismiss}
						className="mt-3 w-full text-muted-foreground text-xs hover:text-foreground transition-colors"
					>
						No thanks, I don&apos;t want free credits
					</button>
				</div>
			</div>
		</div>
	);
}
