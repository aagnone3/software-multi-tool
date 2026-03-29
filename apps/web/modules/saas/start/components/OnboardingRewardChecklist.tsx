"use client";

import { useSession } from "@saas/auth/hooks/use-session";
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
import { CheckCircle2Icon, CircleIcon, GiftIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRecentJobs } from "../hooks/use-recent-jobs";

interface RewardStep {
	id: string;
	label: string;
	description: string;
	href: string;
	isComplete: boolean;
	creditsReward: number;
}

interface OnboardingRewardChecklistProps {
	className?: string;
}

const STORAGE_KEY = "onboarding-reward-checklist-dismissed";

export function OnboardingRewardChecklist({
	className,
}: OnboardingRewardChecklistProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { jobs, isLoading: jobsLoading } = useRecentJobs(5);
	const [isDismissed, setIsDismissed] = useState(false);
	const [hasHydrated, setHasHydrated] = useState(false);

	useEffect(() => {
		const dismissed = localStorage.getItem(STORAGE_KEY);
		if (dismissed === "true") {
			setIsDismissed(true);
		}
		setHasHydrated(true);
	}, []);

	const handleDismiss = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setIsDismissed(true);
	};

	const completedJobsCount = jobs.filter(
		(j) => j.status === "COMPLETED",
	).length;

	const steps: RewardStep[] = [
		{
			id: "profile",
			label: "Add your name",
			description: "Complete your profile",
			href: "/app/settings/account",
			isComplete: Boolean(user?.name && user.name.trim().length > 0),
			creditsReward: 5,
		},
		{
			id: "first-tool",
			label: "Run your first tool",
			description: "Try any AI-powered workflow",
			href: "/app/tools",
			isComplete: completedJobsCount >= 1,
			creditsReward: 10,
		},
		{
			id: "org-setup",
			label: "Set up your workspace",
			description: "Configure your organization",
			href: activeOrganization
				? `/app/${activeOrganization.slug}/settings`
				: "/app/settings",
			isComplete: Boolean(activeOrganization?.name),
			creditsReward: 5,
		},
		{
			id: "three-tools",
			label: "Complete 3 jobs",
			description: "Explore different tools",
			href: "/app/tools",
			isComplete: completedJobsCount >= 3,
			creditsReward: 5,
		},
	];

	const completedCount = steps.filter((s) => s.isComplete).length;
	const totalCredits = steps.reduce((sum, s) => sum + s.creditsReward, 0);
	const earnedCredits = steps
		.filter((s) => s.isComplete)
		.reduce((sum, s) => sum + s.creditsReward, 0);
	const progressPct = Math.round((completedCount / steps.length) * 100);
	const isAllComplete = completedCount === steps.length;

	if (!hasHydrated || isDismissed || jobsLoading || isAllComplete) {
		return null;
	}

	return (
		<Card className={cn("border-primary/20 bg-primary/5", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<GiftIcon className="size-5 text-primary" />
						<CardTitle className="text-lg">
							Earn {totalCredits} Bonus Credits
						</CardTitle>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 -mr-2 -mt-1"
						onClick={handleDismiss}
					>
						<XIcon className="size-4" />
						<span className="sr-only">Dismiss</span>
					</Button>
				</div>
				<CardDescription>
					Complete setup steps to earn free credits.{" "}
					<span className="font-medium text-primary">
						{earnedCredits}/{totalCredits} credits earned
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>
							{completedCount} of {steps.length} complete
						</span>
						<span>{progressPct}%</span>
					</div>
					<Progress value={progressPct} className="h-2" />
				</div>

				<ul className="space-y-1">
					{steps.map((step) => (
						<li key={step.id}>
							<Link
								href={step.href}
								className={cn(
									"flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50",
									step.isComplete && "opacity-60",
								)}
							>
								{step.isComplete ? (
									<CheckCircle2Icon className="size-5 text-green-500 shrink-0" />
								) : (
									<CircleIcon className="size-5 text-muted-foreground shrink-0" />
								)}
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											"text-sm font-medium",
											step.isComplete && "line-through",
										)}
									>
										{step.label}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{step.description}
									</p>
								</div>
								<span
									className={cn(
										"text-xs font-medium shrink-0",
										step.isComplete
											? "text-green-500"
											: "text-primary",
									)}
								>
									+{step.creditsReward} credits
								</span>
							</Link>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
