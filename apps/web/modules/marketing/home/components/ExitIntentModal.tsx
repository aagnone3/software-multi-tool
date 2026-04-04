"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { X } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "exit_intent_dismissed";
const DISMISS_DAYS = 7;

export function ExitIntentModal() {
	const [visible, setVisible] = useState(false);
	const triggered = useRef(false);
	const { track } = useProductAnalytics();

	const dismiss = useCallback(() => {
		track({ name: "marketing_exit_intent_dismissed", props: {} });
		setVisible(false);
		const expires = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
		localStorage.setItem(STORAGE_KEY, String(expires));
	}, [track]);

	useEffect(() => {
		const suppressed = localStorage.getItem(STORAGE_KEY);
		if (suppressed && Date.now() < Number(suppressed)) {
			return;
		}

		const handleMouseLeave = (e: MouseEvent) => {
			if (triggered.current) {
				return;
			}
			if (e.clientY <= 10) {
				triggered.current = true;
				setVisible(true);
				track({ name: "marketing_exit_intent_shown", props: {} });
			}
		};

		document.addEventListener("mouseleave", handleMouseLeave);
		return () =>
			document.removeEventListener("mouseleave", handleMouseLeave);
	}, [track]);

	if (!visible) {
		return null;
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Special offer"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					dismiss();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					dismiss();
				}
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
						onClick={() => {
							track({
								name: "marketing_exit_intent_cta_clicked",
								props: {},
							});
							dismiss();
						}}
						className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm shadow hover:bg-primary/90 transition-colors"
					>
						Claim my 10 free credits →
					</Link>
					<button
						type="button"
						onClick={dismiss}
						className="mt-3 w-full text-muted-foreground text-xs hover:text-foreground transition-colors"
					>
						No thanks, I don&apos;t want 10 free credits
					</button>
				</div>
			</div>
		</div>
	);
}
