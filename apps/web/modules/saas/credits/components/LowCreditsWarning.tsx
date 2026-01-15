"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface LowCreditsWarningProps {
	className?: string;
	threshold?: number;
	showActionButtons?: boolean;
}

export function LowCreditsWarning({
	className,
	threshold = 0.2,
	showActionButtons = true,
}: LowCreditsWarningProps) {
	const { balance, isLoading } = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();

	if (isLoading || !balance) {
		return null;
	}

	// Check if below threshold (default 20%)
	const isLow =
		balance.included > 0 &&
		balance.remaining / balance.included < threshold;

	if (!isLow) {
		return null;
	}

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	return (
		<Alert
			variant="error"
			className={cn("flex items-start gap-3", className)}
		>
			<AlertTriangleIcon className="size-4" />
			<div className="flex-1">
				<AlertTitle>Low on credits</AlertTitle>
				<AlertDescription>
					You have {balance.remaining} credits remaining out of{" "}
					{balance.included} included in your {balance.plan.name}{" "}
					plan.
					{balance.purchasedCredits > 0 && (
						<span>
							{" "}
							Plus {balance.purchasedCredits} purchased credits
							available.
						</span>
					)}
				</AlertDescription>
			</div>
			{showActionButtons && (
				<div className="flex shrink-0 gap-2">
					<Button asChild variant="secondary" size="sm">
						<Link href={billingPath}>Buy Credits</Link>
					</Button>
					<Button asChild variant="primary" size="sm">
						<Link href={billingPath}>Upgrade Plan</Link>
					</Button>
				</div>
			)}
		</Alert>
	);
}
