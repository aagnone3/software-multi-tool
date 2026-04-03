"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useRecentJobs } from "@saas/start/hooks/use-recent-jobs";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	ArrowRightIcon,
	CoinsIcon,
	SparklesIcon,
	XIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "new-user-welcome-banner-dismissed";

interface Step {
	icon: React.ReactNode;
	title: string;
	description: string;
}

const STEPS: Step[] = [
	{
		icon: <ZapIcon className="size-5 text-primary" />,
		title: "Pick a tool",
		description:
			"Browse the tools below and choose one that fits your task.",
	},
	{
		icon: <SparklesIcon className="size-5 text-amber-500" />,
		title: "Upload or type",
		description: "Provide your input — a file, text, or URL — and hit Run.",
	},
	{
		icon: <CoinsIcon className="size-5 text-green-500" />,
		title: "Get results instantly",
		description:
			"AI processes your input and returns structured results in seconds.",
	},
];

export function NewUserWelcomeBanner({ className }: { className?: string }) {
	const { jobs, isLoading } = useRecentJobs(1);
	const { track } = useProductAnalytics();
	const [dismissed, setDismissed] = useState(true); // Start dismissed to avoid flash

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			setDismissed(false);
		}
	}, []);

	useEffect(() => {
		if (!isLoading && !dismissed && jobs.length === 0) {
			track({ name: "new_user_welcome_banner_shown", props: {} });
		}
	}, [isLoading, dismissed, jobs.length, track]);

	const handleDismiss = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setDismissed(true);
		track({ name: "new_user_welcome_banner_dismissed", props: {} });
	};

	// Don't show if loading, dismissed, or user has already run a job
	if (isLoading || dismissed || jobs.length > 0) {
		return null;
	}

	return (
		<div
			className={cn(
				"relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6",
				className,
			)}
		>
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
				aria-label="Dismiss welcome banner"
			>
				<XIcon className="size-4" />
			</button>

			<div className="mb-4 flex items-center gap-2">
				<SparklesIcon className="size-5 text-primary" />
				<h2 className="font-semibold text-base">
					Welcome! Here's how to get started
				</h2>
			</div>

			<div className="grid gap-4 sm:grid-cols-3 mb-5">
				{STEPS.map((step, i) => (
					<div key={step.title} className="flex gap-3 items-start">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
							{i + 1}
						</div>
						<div>
							<div className="flex items-center gap-1.5 mb-0.5">
								{step.icon}
								<span className="font-medium text-sm">
									{step.title}
								</span>
							</div>
							<p className="text-xs text-muted-foreground">
								{step.description}
							</p>
						</div>
					</div>
				))}
			</div>

			<div className="flex flex-wrap gap-2">
				<Button size="sm" asChild>
					<Link
						href="/app/tools/meeting-summarizer"
						onClick={() =>
							track({
								name: "new_user_welcome_cta_clicked",
								props: { cta: "try_tool" },
							})
						}
					>
						<SparklesIcon className="size-3.5 mr-1.5" />
						Try Meeting Summarizer
						<ArrowRightIcon className="size-3.5 ml-1.5" />
					</Link>
				</Button>
				<Button size="sm" variant="outline" asChild>
					<Link
						href="/app/tools"
						onClick={() =>
							track({
								name: "new_user_welcome_cta_clicked",
								props: { cta: "browse_all" },
							})
						}
					>
						Browse all tools
					</Link>
				</Button>
			</div>
		</div>
	);
}
