"use client";

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
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useUsageStats } from "../hooks/use-usage-stats";

interface UsageChartProps {
	className?: string;
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UsageChart({ className }: UsageChartProps) {
	const { byPeriod, isLoading } = useUsageStats({ period: "day" });

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Daily Usage</CardTitle>
					<CardDescription>Credits consumed per day</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData = byPeriod.map((item) => ({
		...item,
		displayDate: formatDate(item.date),
	}));

	const hasData = chartData.length > 0;

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Daily Usage</CardTitle>
				<CardDescription>Credits consumed per day</CardDescription>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis
								dataKey="displayDate"
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
							/>
							<YAxis
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
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
												{data.displayDate}
											</p>
											<p className="text-sm text-muted-foreground">
												{data.credits} credits
											</p>
										</div>
									);
								}}
							/>
							<Line
								type="monotone"
								dataKey="credits"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 4, strokeWidth: 0 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				) : (
					<div
						className={cn(
							"flex h-[300px] items-center justify-center",
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
