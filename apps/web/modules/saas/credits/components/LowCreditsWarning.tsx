"use client";

import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface LowCreditsWarningProps {
	className?: string;
	threshold?: number;
	showUpgradeButton?: boolean;
}

export function LowCreditsWarning({
	className,
	threshold = 0.2,
	showUpgradeButton = true,
}: LowCreditsWarningProps) {
	const { balance, isLoading } = useCreditsBalance();

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
			{showUpgradeButton && (
				<Button
					asChild
					variant="primary"
					size="sm"
					className="shrink-0"
				>
					<Link href="/app/settings/billing">Upgrade Plan</Link>
				</Button>
			)}
		</Alert>
	);
}
