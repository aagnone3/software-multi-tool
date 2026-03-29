"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import {
	ArrowUpCircleIcon,
	ChevronRightIcon,
	CoinsIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

/**
 * Extract pack name from purchase description
 * Description format: "Purchased {PackName} pack ({credits} credits) - Session: cs_xxx"
 */
function extractPackName(description: string): string {
	const match = description.match(/Purchased (\w+) pack/i);
	return match ? `${match[1]} Pack` : "Credit Pack";
}

interface CreditBalanceCardProps {
	className?: string;
}

export function CreditBalanceCard({ className }: CreditBalanceCardProps) {
	const {
		balance,
		isLoading,
		totalCredits,
		percentageUsed,
		isLowCredits,
		isFreePlan,
	} = useCreditsBalance();
	const { activeOrganization } = useActiveOrganization();

	const usageHistoryPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/usage`
		: "/app/settings/usage";

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CoinsIcon className="size-5" />
						Credit Balance
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-24 bg-muted rounded-lg" />
				</CardContent>
			</Card>
		);
	}

	if (!balance) {
		return null;
	}

	const periodEnd = new Date(balance.periodEnd);
	const periodStart = new Date(balance.periodStart);
	const daysRemaining = Math.ceil(
		(periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
	);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CoinsIcon className="size-5" />
					Credit Balance
				</CardTitle>
				<CardDescription>
					Your {balance.plan.name} plan credit usage for this billing
					period
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-1">
					<div className="flex items-baseline justify-between">
						<div>
							<span className="text-4xl font-bold">
								{balance.totalAvailable}
							</span>
							<span className="ml-2 text-muted-foreground">
								credits available
							</span>
						</div>
						{isLowCredits && (
							<span className="text-sm font-medium text-destructive">
								Low balance
							</span>
						)}
					</div>
					{balance.purchasedCredits > 0 && (
						<p className="text-sm text-muted-foreground">
							{balance.remaining} plan +{" "}
							{balance.purchasedCredits} purchased
						</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{balance.used} of {totalCredits} credits used
						</span>
						<span className="font-medium">{percentageUsed}%</span>
					</div>
					<Progress
						value={percentageUsed}
						className={cn(
							"h-2",
							isLowCredits && "[&>*]:bg-destructive",
						)}
					/>
				</div>

				<div className="rounded-lg bg-muted/50 p-3">
					<p className="text-sm text-muted-foreground">
						Plan Credits
					</p>
					<p className="text-lg font-semibold">
						{balance.remaining}
						<span className="text-sm font-normal text-muted-foreground">
							{" "}
							/ {balance.included}
						</span>
						{balance.purchasedCredits > 0 && (
							<span className="text-sm font-normal text-green-600 dark:text-green-400">
								{" "}
								(+{balance.purchasedCredits})
							</span>
						)}
					</p>
					<p className="text-xs text-muted-foreground">
						remaining this period
					</p>
				</div>

				{balance.purchases.length > 0 && (
					<div className="space-y-2">
						<p className="text-sm font-medium">Purchased Credits</p>
						<div className="space-y-2">
							{balance.purchases.map((purchase) => {
								const packName = purchase.description
									? extractPackName(purchase.description)
									: "Credit Pack";
								return (
									<div
										key={purchase.id}
										className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
									>
										<div>
											<p className="text-sm font-medium">
												{packName}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(
													purchase.createdAt,
												).toLocaleDateString()}
											</p>
										</div>
										<p className="text-lg font-semibold text-green-600 dark:text-green-400">
											+{purchase.amount}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{balance.overage > 0 && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
						<p className="text-sm font-medium text-amber-800 dark:text-amber-200">
							Overage: {balance.overage} credits
						</p>
						<p className="text-xs text-amber-600 dark:text-amber-400">
							Additional usage beyond your included credits
						</p>
					</div>
				)}

				<div className="text-sm text-muted-foreground border-t pt-4">
					<p>
						Period: {periodStart.toLocaleDateString()} -{" "}
						{periodEnd.toLocaleDateString()}
					</p>
					<p className="mt-1">
						{daysRemaining > 0
							? `${daysRemaining} days remaining in this period`
							: "Billing period ending soon"}
					</p>
				</div>

				{/* Upgrade nudge: shown when on free plan or when credits are low */}
				{(isFreePlan || isLowCredits) && (
					<div
						className={cn(
							"rounded-lg border p-4",
							isFreePlan
								? "border-primary/20 bg-primary/5"
								: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
						)}
					>
						<div className="flex items-start gap-3">
							{isFreePlan ? (
								<ArrowUpCircleIcon className="mt-0.5 size-5 shrink-0 text-primary" />
							) : (
								<ZapIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
							)}
							<div className="flex-1 min-w-0">
								<p
									className={cn(
										"text-sm font-semibold",
										isFreePlan
											? "text-primary"
											: "text-amber-800 dark:text-amber-200",
									)}
								>
									{isFreePlan
										? "Upgrade for 10× more credits"
										: "Running low — top up or upgrade"}
								</p>
								<p
									className={cn(
										"mt-0.5 text-xs",
										isFreePlan
											? "text-primary/70"
											: "text-amber-700 dark:text-amber-300",
									)}
								>
									{isFreePlan
										? "Starter plan: 100 credits/month for $4.99. Unused credits roll over."
										: "Keep your workflows running without interruption."}
								</p>
								<Button
									asChild
									size="sm"
									className={cn(
										"mt-3 w-full",
										!isFreePlan &&
											"bg-amber-600 hover:bg-amber-700 text-white border-0",
									)}
									variant={isFreePlan ? "primary" : "outline"}
								>
									<Link href={billingPath}>
										{isFreePlan
											? "Upgrade to Starter"
											: "Add credits / upgrade"}
										<ChevronRightIcon className="ml-1.5 size-3.5" />
									</Link>
								</Button>
							</div>
						</div>
					</div>
				)}

				<Button variant="outline" className="w-full" asChild>
					<Link href={usageHistoryPath}>
						View usage history
						<ChevronRightIcon className="size-4 ml-auto" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
