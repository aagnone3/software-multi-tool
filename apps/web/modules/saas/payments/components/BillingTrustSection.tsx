"use client";

import { cn } from "@ui/lib";
import {
	BadgeCheckIcon,
	LockIcon,
	RefreshCcwIcon,
	ShieldCheckIcon,
} from "lucide-react";
import React from "react";

interface TrustItem {
	icon: React.ElementType;
	title: string;
	description: string;
}

const TRUST_ITEMS: TrustItem[] = [
	{
		icon: RefreshCcwIcon,
		title: "30-day money-back guarantee",
		description: "Not satisfied? Get a full refund, no questions asked.",
	},
	{
		icon: BadgeCheckIcon,
		title: "Cancel anytime",
		description: "No lock-in. Cancel your subscription at any moment.",
	},
	{
		icon: LockIcon,
		title: "Secure payment",
		description:
			"Your payment info is encrypted and never stored on our servers.",
	},
	{
		icon: ShieldCheckIcon,
		title: "No hidden fees",
		description:
			"The price you see is exactly what you pay. Nothing extra.",
	},
];

interface BillingTrustSectionProps {
	className?: string;
}

export function BillingTrustSection({ className }: BillingTrustSectionProps) {
	return (
		<div className={cn("rounded-xl border bg-muted/30 p-4", className)}>
			<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Our commitment to you
			</p>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{TRUST_ITEMS.map((item) => (
					<div key={item.title} className="flex items-start gap-3">
						<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
							<item.icon className="size-4 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium leading-tight">
								{item.title}
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground leading-tight">
								{item.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
