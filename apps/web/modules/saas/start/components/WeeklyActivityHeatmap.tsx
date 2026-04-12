"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { cn } from "@ui/lib";
import { CalendarDaysIcon } from "lucide-react";
import React, { useMemo } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface WeeklyActivityHeatmapProps {
	className?: string;
	weeks?: number;
}

interface DayData {
	date: string; // YYYY-MM-DD
	count: number;
	label: string;
}

function getIntensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
	if (count === 0) {
		return 0;
	}
	if (max === 0) {
		return 0;
	}
	const ratio = count / max;
	if (ratio <= 0.25) {
		return 1;
	}
	if (ratio <= 0.5) {
		return 2;
	}
	if (ratio <= 0.75) {
		return 3;
	}
	return 4;
}

const intensityClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: "bg-muted/40 dark:bg-muted/20",
	1: "bg-green-200 dark:bg-green-900",
	2: "bg-green-300 dark:bg-green-700",
	3: "bg-green-400 dark:bg-green-600",
	4: "bg-green-500 dark:bg-green-500",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyActivityHeatmap({
	className,
	weeks = 7,
}: WeeklyActivityHeatmapProps) {
	const { jobs, isLoading } = useRecentJobs(200);

	const { grid, maxCount, totalJobs } = useMemo(() => {
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		// Build a date range: go back `weeks` full weeks from end of today
		const startDate = new Date(today);
		// Align to the start of the current week (Sunday), then go back `weeks - 1` more weeks
		const dayOfWeek = startDate.getDay(); // 0=Sun
		startDate.setDate(startDate.getDate() - dayOfWeek - (weeks - 1) * 7);
		startDate.setHours(0, 0, 0, 0);

		// Count jobs per day
		const countByDate = new Map<string, number>();
		for (const job of jobs) {
			if (job.status !== "COMPLETED") {
				continue;
			}
			const d = new Date(job.createdAt);
			const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
			countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
		}

		// Build 7-column grid (Sun→Sat), weeks rows
		const columns: DayData[][] = [];
		const cursor = new Date(startDate);

		for (let w = 0; w < weeks; w++) {
			const week: DayData[] = [];
			for (let d = 0; d < 7; d++) {
				const key = cursor.toISOString().slice(0, 10);
				const month = cursor.toLocaleString("default", {
					month: "short",
				});
				week.push({
					date: key,
					count: countByDate.get(key) ?? 0,
					label: `${month} ${cursor.getDate()}`,
				});
				cursor.setDate(cursor.getDate() + 1);
			}
			columns.push(week);
		}

		const allCounts = columns.flat().map((d) => d.count);
		const maxCount = Math.max(...allCounts, 0);
		const totalJobs = allCounts.reduce((a, b) => a + b, 0);

		return { grid: columns, maxCount, totalJobs };
	}, [jobs, weeks]);

	if (isLoading) {
		return (
			<Card className={cn("animate-pulse", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<CalendarDaysIcon className="size-4" />
						Activity
					</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						className="grid gap-1"
						style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
					>
						{Array.from({ length: weeks * 7 }).map((_, i) => (
							<div
								key={i}
								className="aspect-square rounded-sm bg-muted/40 size-4"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<CalendarDaysIcon className="size-4" />
					Activity Heatmap
				</CardTitle>
				<CardDescription>
					{totalJobs === 0
						? "No completed jobs yet"
						: `${totalJobs} completed job${totalJobs === 1 ? "" : "s"} in the last ${weeks} weeks`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Day labels row */}
				<div
					className="mb-1 grid gap-1"
					style={{
						gridTemplateColumns: `24px repeat(${weeks}, 1fr)`,
					}}
				>
					<div />
					{grid.map((week) => {
						const firstDay = new Date(week[0].date);
						// Show month label if it's the 1st or the start of the range
						const isFirstOfMonth = firstDay.getDate() <= 7;
						return (
							<div
								key={week[0].date}
								className="text-center text-[9px] text-muted-foreground overflow-hidden"
							>
								{isFirstOfMonth
									? firstDay.toLocaleString("default", {
											month: "short",
										})
									: ""}
							</div>
						);
					})}
				</div>
				{/* Heatmap grid: 7 rows (Sun→Sat), weeks columns */}
				{DAY_LABELS.map((dayLabel, dayIdx) => (
					<div
						key={dayLabel}
						className="grid gap-1 mb-1"
						style={{
							gridTemplateColumns: `24px repeat(${weeks}, 1fr)`,
						}}
					>
						<span className="text-[9px] text-muted-foreground text-right pr-1 leading-4">
							{dayIdx % 2 === 1 ? dayLabel : ""}
						</span>
						{grid.map((week) => {
							const day = week[dayIdx];
							const intensity = getIntensity(day.count, maxCount);
							return (
								<div
									key={day.date}
									title={`${day.label}: ${day.count} job${day.count === 1 ? "" : "s"}`}
									className={cn(
										"aspect-square rounded-sm size-4 cursor-default transition-colors",
										intensityClasses[intensity],
									)}
								/>
							);
						})}
					</div>
				))}
				{/* Legend */}
				<div className="mt-2 flex items-center justify-end gap-1">
					<span className="text-[9px] text-muted-foreground mr-1">
						Less
					</span>
					{([0, 1, 2, 3, 4] as const).map((level) => (
						<div
							key={level}
							className={cn(
								"size-3 rounded-sm",
								intensityClasses[level],
							)}
						/>
					))}
					<span className="text-[9px] text-muted-foreground ml-1">
						More
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
