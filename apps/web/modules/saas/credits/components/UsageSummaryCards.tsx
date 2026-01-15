"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import {
	AlertTriangleIcon,
	CoinsIcon,
	TrendingUpIcon,
	WrenchIcon,
} from "lucide-react";
import { useUsageStats } from "../hooks/use-usage-stats";
import { formatToolName } from "../lib/format-tool-name";

interface UsageSummaryCardsProps {
	className?: string;
}

export function UsageSummaryCards({ className }: UsageSummaryCardsProps) {
	const {
		totalUsed,
		totalOverage,
		mostUsedTool,
		totalOperations,
		isLoading,
	} = useUsageStats();

	if (isLoading) {
		return (
			<div className={cn("grid gap-4 md:grid-cols-4", className)}>
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={`skeleton-${i}`}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const overageCost = (totalOverage * 0.02).toFixed(2);

	return (
		<div className={cn("grid gap-4 md:grid-cols-4", className)}>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						This Month
					</CardTitle>
					<CoinsIcon className="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">{totalUsed}</p>
					<p className="text-xs text-muted-foreground">
						credits used
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Overage
					</CardTitle>
					<AlertTriangleIcon
						className={cn(
							"size-4",
							totalOverage > 0
								? "text-amber-500"
								: "text-muted-foreground",
						)}
					/>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">{totalOverage}</p>
					<p className="text-xs text-muted-foreground">
						${overageCost} charged
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Most Used Tool
					</CardTitle>
					<WrenchIcon className="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold truncate">
						{mostUsedTool
							? formatToolName(mostUsedTool.toolSlug)
							: "-"}
					</p>
					<p className="text-xs text-muted-foreground">
						{mostUsedTool?.credits ?? 0} credits
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Operations
					</CardTitle>
					<TrendingUpIcon className="size-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">{totalOperations}</p>
					<p className="text-xs text-muted-foreground">
						tool executions
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
