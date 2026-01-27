"use client";

import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	ActivityIcon,
	ChevronRightIcon,
	ClockIcon,
	CoinsIcon,
	GiftIcon,
	RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import {
	type Transaction,
	useCreditsHistory,
} from "../../credits/hooks/use-credits-history";
import { formatToolName } from "../../credits/lib/format-tool-name";

interface RecentActivityFeedProps {
	className?: string;
	maxItems?: number;
}

function getTransactionIcon(type: Transaction["type"]) {
	switch (type) {
		case "GRANT":
			return GiftIcon;
		case "USAGE":
			return CoinsIcon;
		case "OVERAGE":
			return CoinsIcon;
		case "REFUND":
			return RefreshCwIcon;
		case "PURCHASE":
			return CoinsIcon;
		case "ADJUSTMENT":
			return RefreshCwIcon;
		default:
			return ActivityIcon;
	}
}

function getTransactionColor(type: Transaction["type"]) {
	switch (type) {
		case "GRANT":
			return "text-green-500";
		case "USAGE":
			return "text-blue-500";
		case "OVERAGE":
			return "text-amber-500";
		case "REFUND":
			return "text-green-500";
		case "PURCHASE":
			return "text-primary";
		case "ADJUSTMENT":
			return "text-muted-foreground";
		default:
			return "text-muted-foreground";
	}
}

function getTransactionLabel(transaction: Transaction) {
	switch (transaction.type) {
		case "GRANT":
			return "Credits granted";
		case "USAGE":
			return transaction.toolSlug
				? `Used ${formatToolName(transaction.toolSlug)}`
				: "Credits used";
		case "OVERAGE":
			return transaction.toolSlug
				? `Overage: ${formatToolName(transaction.toolSlug)}`
				: "Overage credits";
		case "REFUND":
			return "Credits refunded";
		case "PURCHASE":
			return "Credits purchased";
		case "ADJUSTMENT":
			return "Credit adjustment";
		default:
			return "Activity";
	}
}

function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return "Just now";
	}
	if (diffMins < 60) {
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString();
}

export function RecentActivityFeed({
	className,
	maxItems = 5,
}: RecentActivityFeedProps) {
	const { transactions, isLoading } = useCreditsHistory({ limit: maxItems });

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ActivityIcon className="size-5" />
						Recent Activity
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="flex items-center gap-3"
						>
							<Skeleton className="size-8 rounded-full" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-4 w-12" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (transactions.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ActivityIcon className="size-5" />
						Recent Activity
					</CardTitle>
					<CardDescription>Your recent actions</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						<ClockIcon className="size-10 text-muted-foreground/40 mb-3" />
						<p className="text-sm text-muted-foreground">
							No activity yet
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Start using tools to see your activity here
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<ActivityIcon className="size-5" />
					Recent Activity
				</CardTitle>
				<CardDescription>
					Your latest credit transactions
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-1">
				{transactions.map((transaction) => {
					const Icon = getTransactionIcon(transaction.type);
					const colorClass = getTransactionColor(transaction.type);
					const isPositive =
						transaction.type === "GRANT" ||
						transaction.type === "REFUND" ||
						transaction.type === "PURCHASE";

					return (
						<div
							key={transaction.id}
							className="flex items-center gap-3 rounded-lg p-2"
						>
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-full bg-muted shrink-0",
									colorClass,
								)}
							>
								<Icon className="size-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">
									{getTransactionLabel(transaction)}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatTimeAgo(transaction.createdAt)}
								</p>
							</div>
							<span
								className={cn(
									"text-sm font-medium tabular-nums shrink-0",
									isPositive
										? "text-green-600"
										: "text-foreground",
								)}
							>
								{isPositive ? "+" : "-"}
								{Math.abs(transaction.amount)}
							</span>
						</div>
					);
				})}

				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full"
						asChild
					>
						<Link href="/app/settings/usage">
							View all activity
							<ChevronRightIcon className="size-4 ml-1" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
