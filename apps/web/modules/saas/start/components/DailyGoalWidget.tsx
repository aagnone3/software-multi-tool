"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import {
	CheckCircle2Icon,
	FlameIcon,
	PencilIcon,
	TargetIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface DailyGoalWidgetProps {
	className?: string;
}

const GOAL_STORAGE_KEY = "daily-tool-goal";
const DEFAULT_GOAL = 3;

function getTodayKey(): string {
	return new Date().toISOString().split("T")[0];
}

export function DailyGoalWidget({ className }: DailyGoalWidgetProps) {
	const { jobs, isLoading } = useRecentJobs(20);
	const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState<string>("");
	const { track } = useProductAnalytics();
	const goalMetTrackedRef = useRef(false);

	// Load goal from localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(GOAL_STORAGE_KEY);
			if (stored) {
				const parsed = Number.parseInt(stored, 10);
				if (!Number.isNaN(parsed) && parsed > 0) {
					setGoal(parsed);
				}
			}
		} catch {
			// ignore
		}
	}, []);

	// Count today's completed jobs
	const todayKey = getTodayKey();
	const todayCompletedCount = jobs.filter((job) => {
		if (job.status !== "COMPLETED") {
			return false;
		}
		const jobDate = new Date(job.createdAt).toISOString().split("T")[0];
		return jobDate === todayKey;
	}).length;

	const progressPct = Math.min(
		Math.round((todayCompletedCount / goal) * 100),
		100,
	);
	const isGoalMet = todayCompletedCount >= goal;

	// Track goal completion once per session when the goal is first met
	useEffect(() => {
		if (isGoalMet && !goalMetTrackedRef.current && !isLoading) {
			goalMetTrackedRef.current = true;
			track({
				name: "daily_goal_completed",
				props: { goal, total_completed: todayCompletedCount },
			});
		}
	}, [isGoalMet, goal, todayCompletedCount, isLoading, track]);

	const handleEditSave = () => {
		const parsed = Number.parseInt(editValue, 10);
		if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 50) {
			setGoal(parsed);
			try {
				localStorage.setItem(GOAL_STORAGE_KEY, String(parsed));
			} catch {
				// ignore
			}
			track({ name: "daily_goal_set", props: { goal: parsed } });
		}
		setIsEditing(false);
	};

	const handleEditStart = () => {
		setEditValue(String(goal));
		setIsEditing(true);
	};

	if (isLoading) {
		return null;
	}

	return (
		<Card
			className={cn(
				className,
				isGoalMet && "border-green-500/40 bg-green-500/5",
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						{isGoalMet ? (
							<CheckCircle2Icon className="size-4 text-green-500" />
						) : (
							<FlameIcon className="size-4 text-orange-500" />
						)}
						Daily Goal
					</CardTitle>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={handleEditStart}
						aria-label="Edit goal"
					>
						<PencilIcon className="size-3.5" />
					</Button>
				</div>
				<CardDescription>
					{isGoalMet
						? "Goal reached! Great work today 🎉"
						: `Run ${goal} tools today to hit your goal`}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{isEditing ? (
					<div className="flex items-center gap-2">
						<TargetIcon className="size-4 text-muted-foreground shrink-0" />
						<Input
							type="number"
							min={1}
							max={50}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							className="h-8 w-20 text-center text-sm"
							aria-label="Daily goal input"
						/>
						<Button
							size="sm"
							className="h-8 px-3 text-xs"
							onClick={handleEditSave}
						>
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-3 text-xs"
							onClick={() => setIsEditing(false)}
						>
							Cancel
						</Button>
					</div>
				) : (
					<>
						<div className="flex items-baseline justify-between">
							<div className="flex items-baseline gap-1">
								<span className="text-2xl font-bold">
									{todayCompletedCount}
								</span>
								<span className="text-sm text-muted-foreground">
									/ {goal} runs
								</span>
							</div>
							<span
								className={cn(
									"text-sm font-medium",
									isGoalMet
										? "text-green-500"
										: "text-muted-foreground",
								)}
							>
								{progressPct}%
							</span>
						</div>
						<Progress
							value={progressPct}
							className={cn(
								"h-2",
								isGoalMet && "[&>*]:bg-green-500",
							)}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}
