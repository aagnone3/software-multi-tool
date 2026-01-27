"use client";

import { useUsageStats } from "@saas/credits/hooks/use-usage-stats";
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
import { BarChart3Icon, TrendingUpIcon } from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface UsageTrendChartProps {
	className?: string;
}

type Period = "week" | "month";

function formatDate(dateStr: string, period: Period): string {
	const date = new Date(dateStr);
	if (period === "week") {
		return date.toLocaleDateString("en-US", { weekday: "short" });
	}
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UsageTrendChart({ className }: UsageTrendChartProps) {
	const [period, setPeriod] = useState<Period>("week");

	// Fetch usage stats for the selected period
	const { byPeriod, isLoading } = useUsageStats({
		period: "day",
	});

	// Filter data based on selected period
	const now = new Date();
	const cutoffDate = new Date();
	if (period === "week") {
		cutoffDate.setDate(now.getDate() - 7);
	} else {
		cutoffDate.setDate(now.getDate() - 30);
	}

	const filteredData = byPeriod.filter((item) => {
		const itemDate = new Date(item.date);
		return itemDate >= cutoffDate;
	});

	const chartData = filteredData.map((item) => ({
		...item,
		displayDate: formatDate(item.date, period),
	}));

	// Calculate trend
	const halfLength = Math.floor(chartData.length / 2);
	const firstHalf = chartData.slice(0, halfLength);
	const secondHalf = chartData.slice(halfLength);

	const firstHalfAvg =
		firstHalf.length > 0
			? firstHalf.reduce((sum, item) => sum + item.credits, 0) /
				firstHalf.length
			: 0;
	const secondHalfAvg =
		secondHalf.length > 0
			? secondHalf.reduce((sum, item) => sum + item.credits, 0) /
				secondHalf.length
			: 0;

	const trendPercentage =
		firstHalfAvg > 0
			? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
			: 0;

	const totalForPeriod = chartData.reduce(
		(sum, item) => sum + item.credits,
		0,
	);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3Icon className="size-5" />
						Usage Trend
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[200px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const hasData = chartData.length > 0;

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<BarChart3Icon className="size-5" />
							Usage Trend
						</CardTitle>
						<CardDescription>
							{totalForPeriod} credits used in the last{" "}
							{period === "week" ? "7 days" : "30 days"}
						</CardDescription>
					</div>
					<div className="flex gap-1 rounded-lg border p-0.5">
						<Button
							variant={period === "week" ? "secondary" : "ghost"}
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={() => setPeriod("week")}
						>
							7D
						</Button>
						<Button
							variant={period === "month" ? "secondary" : "ghost"}
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={() => setPeriod("month")}
						>
							30D
						</Button>
					</div>
				</div>

				{/* Trend indicator */}
				{hasData && trendPercentage !== 0 && (
					<div className="flex items-center gap-2 mt-2">
						<TrendingUpIcon
							className={cn(
								"size-4",
								trendPercentage > 0
									? "text-emerald-500"
									: "text-rose-500",
								trendPercentage < 0 && "rotate-180",
							)}
						/>
						<span
							className={cn(
								"text-sm font-medium",
								trendPercentage > 0
									? "text-emerald-500"
									: "text-rose-500",
							)}
						>
							{trendPercentage > 0 ? "+" : ""}
							{trendPercentage}%
						</span>
						<span className="text-xs text-muted-foreground">
							vs. previous period
						</span>
					</div>
				)}
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ResponsiveContainer width="100%" height={200}>
						<AreaChart data={chartData}>
							<defs>
								<linearGradient
									id="colorCredits"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
								vertical={false}
							/>
							<XAxis
								dataKey="displayDate"
								tick={{ fontSize: 11 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
								interval={period === "month" ? 4 : 0}
							/>
							<YAxis
								tick={{ fontSize: 11 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
								width={35}
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (!active || !payload?.length) {
										return null;
									}
									const data = payload[0].payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<p className="text-sm font-medium">
												{new Date(
													data.date,
												).toLocaleDateString("en-US", {
													weekday: "short",
													month: "short",
													day: "numeric",
												})}
											</p>
											<p className="text-sm text-muted-foreground">
												{data.credits} credits
											</p>
										</div>
									);
								}}
							/>
							<Area
								type="monotone"
								dataKey="credits"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								fill="url(#colorCredits)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				) : (
					<div
						className={cn(
							"flex h-[200px] items-center justify-center",
							"text-sm text-muted-foreground",
						)}
					>
						No usage data available for this period
					</div>
				)}
			</CardContent>
		</Card>
	);
}
