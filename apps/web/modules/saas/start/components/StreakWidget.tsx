"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib";
import { FlameIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface StreakWidgetProps {
	className?: string;
}

function getStreakFromJobs(jobs: { completedAt: string | null }[]): {
	current: number;
	best: number;
} {
	const completedDays = new Set<string>();
	for (const job of jobs) {
		if (job.completedAt) {
			const day = new Date(job.completedAt).toISOString().slice(0, 10);
			completedDays.add(day);
		}
	}

	if (completedDays.size === 0) return { current: 0, best: 0 };

	const sortedDays = Array.from(completedDays).sort().reverse();
	const today = new Date().toISOString().slice(0, 10);
	const yesterday = new Date(Date.now() - 86_400_000)
		.toISOString()
		.slice(0, 10);

	// Current streak: must include today or yesterday to be active
	let current = 0;
	if (sortedDays[0] === today || sortedDays[0] === yesterday) {
		current = 1;
		let prev = sortedDays[0];
		for (let i = 1; i < sortedDays.length; i++) {
			const expected = new Date(new Date(prev).getTime() - 86_400_000)
				.toISOString()
				.slice(0, 10);
			if (sortedDays[i] === expected) {
				current++;
				prev = sortedDays[i];
			} else {
				break;
			}
		}
	}

	// Best streak across all data
	let best = 1;
	let run = 1;
	const asc = Array.from(completedDays).sort();
	for (let i = 1; i < asc.length; i++) {
		const prevDay = new Date(asc[i - 1]).getTime();
		const curDay = new Date(asc[i]).getTime();
		if (curDay - prevDay === 86_400_000) {
			run++;
			if (run > best) best = run;
		} else {
			run = 1;
		}
	}

	return { current, best: Math.max(best, current) };
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90];

export function StreakWidget({ className }: StreakWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(100);
	const { track } = useProductAnalytics();
	const trackedMilestone = useRef<number | null>(null);

	const { current, best } = useMemo(() => getStreakFromJobs(jobs), [jobs]);

	useEffect(() => {
		if (isLoading || current === 0) return;
		const milestone = STREAK_MILESTONES.filter((m) => current >= m).at(-1);
		if (milestone && trackedMilestone.current !== milestone) {
			trackedMilestone.current = milestone;
			track({
				name: "streak_milestone_reached",
				props: { streak_days: current, is_best: current >= best },
			});
		}
	}, [current, best, isLoading, track]);

	if (isLoading) return null;

	return (
		<Card className={cn("flex flex-col", className)}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<FlameIcon className="h-4 w-4 text-orange-500" />
					Activity Streak
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
				<div className="text-center">
					<div
						className={cn(
							"text-5xl font-bold",
							current > 0
								? "text-orange-500"
								: "text-muted-foreground",
						)}
					>
						{current}
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						{current === 1 ? "day in a row" : "days in a row"}
					</div>
				</div>
				{best > 0 && (
					<div className="text-center">
						<div className="text-xs text-muted-foreground">
							Best:{" "}
							<span className="font-medium text-foreground">
								{best} {best === 1 ? "day" : "days"}
							</span>
						</div>
					</div>
				)}
				{current === 0 && (
					<p className="text-center text-xs text-muted-foreground">
						Complete a job today to start your streak!
					</p>
				)}
			</CardContent>
		</Card>
	);
}
