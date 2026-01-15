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
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useUsageStats } from "../hooks/use-usage-stats";
import { formatToolName } from "../lib/format-tool-name";

interface UsageByToolChartProps {
	className?: string;
}

export function UsageByToolChart({ className }: UsageByToolChartProps) {
	const { byTool, isLoading } = useUsageStats();

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Usage by Tool</CardTitle>
					<CardDescription>
						Credit consumption breakdown
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData = byTool.map((item) => ({
		...item,
		toolName: formatToolName(item.toolSlug),
	}));

	const hasData = chartData.length > 0;

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Usage by Tool</CardTitle>
				<CardDescription>Credit consumption breakdown</CardDescription>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData} layout="vertical">
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
								horizontal={true}
								vertical={false}
							/>
							<XAxis
								type="number"
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
							/>
							<YAxis
								dataKey="toolName"
								type="category"
								width={150}
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								className="fill-muted-foreground"
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (!active || !payload?.length)
										return null;
									const data = payload[0].payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<p className="text-sm font-medium">
												{data.toolName}
											</p>
											<p className="text-sm text-muted-foreground">
												{data.credits} credits (
												{data.count} operations)
											</p>
										</div>
									);
								}}
							/>
							<Bar
								dataKey="credits"
								fill="hsl(var(--primary))"
								radius={[0, 4, 4, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<div
						className={cn(
							"flex h-[300px] items-center justify-center",
							"text-sm text-muted-foreground",
						)}
					>
						No tool usage data available
					</div>
				)}
			</CardContent>
		</Card>
	);
}
