"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

interface UpgradeGateProps {
	/** Content to render when the user has access */
	children: React.ReactNode;
	/** Feature name shown in the upgrade prompt, e.g. "Bulk Export" */
	featureName?: string;
	/** Optional short description shown below the feature name */
	description?: string;
	/** Additional className for the wrapper */
	className?: string;
	/**
	 * Override the access check. When `true` the children are always shown.
	 * Useful for server-side checks where you already know the user's plan.
	 */
	hasAccess?: boolean;
}

/**
 * UpgradeGate wraps content that should only be accessible to paid users.
 * When a free-plan user views the gate, the children are blurred and an
 * upgrade prompt is rendered on top.
 *
 * Usage:
 *   <UpgradeGate featureName="Bulk Export" description="Export all jobs at once">
 *     <BulkExportButton />
 *   </UpgradeGate>
 */
export function UpgradeGate({
	children,
	featureName = "this feature",
	description,
	className,
	hasAccess: hasAccessProp,
}: UpgradeGateProps) {
	const { isFreePlan, isLoading, balance } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	// Respect explicit override; fall back to plan check
	const isLocked =
		hasAccessProp !== undefined ? !hasAccessProp : !isLoading && isFreePlan;

	useEffect(() => {
		if (isLocked) {
			track({
				name: "upgrade_gate_viewed",
				props: {
					feature_name: featureName,
					plan_id: balance?.plan.id ?? "free",
				},
			});
		}
	}, [isLocked, featureName, balance?.plan.id, track]);

	if (!isLocked) {
		return <>{children}</>;
	}

	return (
		<div className={cn("relative", className)}>
			{/* Blurred children — still renders for layout stability */}
			<div
				className="select-none blur-sm pointer-events-none"
				aria-hidden="true"
			>
				{children}
			</div>

			{/* Overlay */}
			<div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-[2px] p-4 text-center">
				<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 mb-3">
					<LockIcon className="size-5 text-primary" />
				</div>
				<p className="font-semibold text-sm">
					Upgrade to unlock {featureName}
				</p>
				{description && (
					<p className="mt-1 text-muted-foreground text-xs max-w-xs">
						{description}
					</p>
				)}
				<div className="mt-4 flex gap-2">
					<Button asChild size="sm" className="gap-1.5">
						<Link href={billingPath}>
							<SparklesIcon className="size-3.5" />
							Upgrade to Pro
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link href="/pricing">View plans</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
