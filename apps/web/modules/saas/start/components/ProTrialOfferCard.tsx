"use client";

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { CheckIcon, GiftIcon, SparklesIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useState } from "react";

const STORAGE_KEY = "pro-trial-offer-dismissed";

const TRIAL_FEATURES = [
	"500 credits included — no card required",
	"Priority job processing",
	"Unlimited tool access for 7 days",
	"Cancel anytime, no commitment",
];

interface ProTrialOfferCardProps {
	className?: string;
}

export function ProTrialOfferCard({ className }: ProTrialOfferCardProps) {
	const { isFreePlan, isLoading } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();

	const [dismissed, setDismissed] = useState<boolean>(() => {
		if (typeof window === "undefined") {
			return false;
		}
		return localStorage.getItem(STORAGE_KEY) === "true";
	});

	const handleDismiss = useCallback(() => {
		localStorage.setItem(STORAGE_KEY, "true");
		setDismissed(true);
	}, []);

	if (isLoading || !isFreePlan || dismissed) {
		return null;
	}

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	return (
		<Card
			className={`relative border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className ?? ""}`}
			data-testid="pro-trial-offer-card"
		>
			<button
				type="button"
				onClick={handleDismiss}
				aria-label="Dismiss trial offer"
				className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				data-testid="dismiss-button"
			>
				<XIcon className="size-4" />
			</button>

			<CardContent className="pt-5 pb-4 pr-8">
				<div className="flex items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
						<GiftIcon className="size-5 text-primary" />
					</div>

					<div className="flex-1 space-y-3">
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-sm">
									Try Pro free for 7 days
								</h3>
								<Badge className="text-xs bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
									<SparklesIcon className="size-3 mr-1" />
									No card needed
								</Badge>
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Unlock everything Pro has to offer — completely
								free, no commitment.
							</p>
						</div>

						<ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
							{TRIAL_FEATURES.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-1.5 text-xs text-muted-foreground"
								>
									<CheckIcon className="size-3.5 shrink-0 text-primary" />
									{feature}
								</li>
							))}
						</ul>

						<div className="flex items-center gap-2">
							<Button asChild size="sm" className="text-xs h-8">
								<Link href={billingPath}>Start free trial</Link>
							</Button>
							<Button
								asChild
								size="sm"
								variant="ghost"
								className="text-xs h-8 text-muted-foreground"
							>
								<Link href="/pricing">See pricing</Link>
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
