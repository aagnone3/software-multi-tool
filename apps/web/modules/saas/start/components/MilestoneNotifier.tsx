"use client";

import { useJobsList } from "@tools/hooks/use-job-polling";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

const MILESTONES: Record<
	number,
	{ title: string; description: string; emoji: string }
> = {
	1: {
		title: "First job complete! 🎉",
		description: "You've run your first tool. Welcome aboard!",
		emoji: "🎉",
	},
	10: {
		title: "10 jobs done!",
		description: "You're on a roll — 10 tool runs completed.",
		emoji: "🔟",
	},
	25: {
		title: "25 jobs milestone",
		description: "A quarter-century of tool runs. Keep going!",
		emoji: "🏅",
	},
	50: {
		title: "50 jobs completed",
		description: "You've hit 50 runs. You're a power user!",
		emoji: "⚡",
	},
	100: {
		title: "100 jobs!",
		description: "Triple digits. You're unstoppable.",
		emoji: "💯",
	},
};

const STORAGE_KEY = "smt:milestone-notified";

function getNotifiedMilestones(): Set<number> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return new Set();
		return new Set(JSON.parse(raw) as number[]);
	} catch {
		return new Set();
	}
}

function saveMilestone(milestone: number): void {
	try {
		const existing = getNotifiedMilestones();
		existing.add(milestone);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(existing)));
	} catch {
		// ignore storage errors
	}
}

export function MilestoneNotifier() {
	const result = useJobsList();
	const checkedRef = useRef(false);

	useEffect(() => {
		if (result.isLoading || checkedRef.current) return;
		checkedRef.current = true;

		const jobs = result.jobs ?? [];
		const completedCount = jobs.filter(
			(j: { status: string }) => j.status === "COMPLETED",
		).length;
		if (completedCount === 0) return;

		const notified = getNotifiedMilestones();
		const milestoneNumbers = Object.keys(MILESTONES)
			.map(Number)
			.sort((a, b) => a - b);

		for (const milestone of milestoneNumbers) {
			if (completedCount >= milestone && !notified.has(milestone)) {
				const { title, description } = MILESTONES[milestone];
				saveMilestone(milestone);
				toast.success(title, {
					description,
					duration: 6000,
				});
				// Only fire the highest unnotified milestone
				break;
			}
		}
	}, [result.isLoading, result.jobs]);

	return null;
}
