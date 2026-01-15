"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import { CoinsIcon } from "lucide-react";
import Link from "next/link";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface CreditBalanceIndicatorProps {
	className?: string;
}

export function CreditBalanceIndicator({
	className,
}: CreditBalanceIndicatorProps) {
	const { balance, isLoading, isLowCredits } = useCreditsBalance();

	if (isLoading) {
		return (
			<div
				className={cn(
					"flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm animate-pulse",
					className,
				)}
			>
				<CoinsIcon className="size-3.5 opacity-50" />
				<span className="opacity-50">--</span>
			</div>
		);
	}

	if (!balance) {
		return null;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link
						href="/app/settings/billing"
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors hover:bg-muted/80",
							isLowCredits
								? "bg-destructive/10 text-destructive hover:bg-destructive/20"
								: "bg-muted",
							className,
						)}
					>
						<CoinsIcon
							className={cn(
								"size-3.5",
								isLowCredits
									? "text-destructive"
									: "text-muted-foreground",
							)}
						/>
						<span className="font-medium">
							{balance.totalAvailable}
						</span>
					</Link>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<div className="space-y-1">
						<p className="font-medium">
							{balance.totalAvailable} credits available
						</p>
						<p className="text-xs text-muted-foreground">
							{balance.remaining} included +{" "}
							{balance.purchasedCredits} purchased
						</p>
						{isLowCredits && (
							<p className="text-xs text-destructive">
								Running low on credits!
							</p>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
