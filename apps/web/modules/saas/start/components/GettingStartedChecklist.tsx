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
import { CheckCircle2Icon, CircleIcon, RocketIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUsageStats } from "../../credits/hooks/use-usage-stats";

interface ChecklistItem {
	id: string;
	label: string;
	description: string;
	href: string;
	isComplete: boolean;
}

interface GettingStartedChecklistProps {
	className?: string;
}

const STORAGE_KEY = "getting-started-dismissed";

export function GettingStartedChecklist({
	className,
}: GettingStartedChecklistProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { totalOperations, isLoading: usageLoading } = useUsageStats();
	const [isDismissed, setIsDismissed] = useState(false);

	// Load dismissed state from localStorage
	useEffect(() => {
		const dismissed = localStorage.getItem(STORAGE_KEY);
		if (dismissed === "true") {
			setIsDismissed(true);
		}
	}, []);

	const handleDismiss = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setIsDismissed(true);
	};

	// Build checklist based on user state
	const checklistItems: ChecklistItem[] = [
		{
			id: "profile",
			label: "Complete your profile",
			description: "Add your name and avatar",
			href: "/app/settings/account",
			isComplete: Boolean(user?.name && user.name.length > 0),
		},
		{
			id: "organization",
			label: "Set up your organization",
			description: "Configure your workspace",
			href: activeOrganization
				? `/app/${activeOrganization.slug}/settings`
				: "/app/settings",
			isComplete: Boolean(activeOrganization?.name),
		},
		{
			id: "first-tool",
			label: "Try your first tool",
			description: "Run any AI-powered tool",
			href: "/app/tools",
			isComplete: totalOperations > 0,
		},
		{
			id: "billing",
			label: "Review your plan",
			description: "Check credits and billing options",
			href: activeOrganization
				? `/app/${activeOrganization.slug}/settings/billing`
				: "/app/settings/billing",
			isComplete: Boolean(activeOrganization),
		},
	];

	const completedCount = checklistItems.filter(
		(item) => item.isComplete,
	).length;
	const progressPercentage = Math.round(
		(completedCount / checklistItems.length) * 100,
	);
	const isAllComplete = completedCount === checklistItems.length;

	// Don't show if dismissed or loading
	if (isDismissed || usageLoading) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<RocketIcon className="size-5 text-primary" />
						<CardTitle className="text-lg">
							Getting Started
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
					{isAllComplete
						? "Great job! You've completed all setup steps."
						: "Complete these steps to get the most out of your workspace."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{completedCount} of {checklistItems.length} complete
						</span>
						<span className="font-medium">
							{progressPercentage}%
						</span>
					</div>
					<Progress value={progressPercentage} className="h-2" />
				</div>

				<ul className="space-y-2">
					{checklistItems.map((item) => (
						<li key={item.id}>
							<Link
								href={item.href}
								className={cn(
									"flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50",
									item.isComplete && "opacity-60",
								)}
							>
								{item.isComplete ? (
									<CheckCircle2Icon className="size-5 text-green-500 shrink-0" />
								) : (
									<CircleIcon className="size-5 text-muted-foreground shrink-0" />
								)}
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											"text-sm font-medium",
											item.isComplete && "line-through",
										)}
									>
										{item.label}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{item.description}
									</p>
								</div>
							</Link>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
