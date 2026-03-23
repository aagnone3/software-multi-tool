"use client";

import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import {
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	SearchIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRecentJobs } from "../../start/hooks/use-recent-jobs";

interface JobSearchWidgetProps {
	className?: string;
	maxResults?: number;
}

const STATUS_CONFIG = {
	COMPLETED: {
		label: "Done",
		icon: CheckCircle2Icon,
		className: "text-green-600",
	},
	FAILED: { label: "Failed", icon: XCircleIcon, className: "text-red-600" },
	PROCESSING: {
		label: "Running",
		icon: Loader2Icon,
		className: "text-blue-600",
	},
	PENDING: { label: "Queued", icon: ClockIcon, className: "text-yellow-600" },
	CANCELLED: {
		label: "Cancelled",
		icon: XCircleIcon,
		className: "text-gray-400",
	},
} as const;

function formatRelative(dateStr: string): string {
	const ms = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(ms / 60000);
	if (minutes < 1) {
		return "just now";
	}
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}
	return `${Math.floor(hours / 24)}d ago`;
}

function slugToName(slug: string): string {
	return slug
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

export function JobSearchWidget({
	className,
	maxResults = 8,
}: JobSearchWidgetProps) {
	const [query, setQuery] = useState("");
	const { jobs, isLoading } = useRecentJobs(50);

	const filtered = useMemo(() => {
		if (!query.trim()) {
			return jobs.slice(0, maxResults);
		}
		const q = query.toLowerCase();
		return jobs
			.filter(
				(job) =>
					job.toolSlug.toLowerCase().includes(q) ||
					slugToName(job.toolSlug).toLowerCase().includes(q) ||
					job.status.toLowerCase().includes(q) ||
					job.id.toLowerCase().includes(q),
			)
			.slice(0, maxResults);
	}, [jobs, query, maxResults]);

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<SearchIcon className="h-4 w-4" />
					Job Search
				</CardTitle>
				<CardDescription>
					Search across your recent jobs
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="relative">
					<SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by tool, status, or job ID…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-8"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
							aria-label="Clear search"
						>
							<XCircleIcon className="h-4 w-4" />
						</button>
					)}
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
						<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
						Loading jobs…
					</div>
				) : filtered.length === 0 ? (
					<p className="py-4 text-center text-sm text-muted-foreground">
						{query ? "No jobs match your search." : "No jobs yet."}
					</p>
				) : (
					<ul className="space-y-1.5">
						{filtered.map((job) => {
							const cfg =
								STATUS_CONFIG[
									job.status as keyof typeof STATUS_CONFIG
								] ?? STATUS_CONFIG.CANCELLED;
							const Icon = cfg.icon;
							return (
								<li key={job.id}>
									<Link
										href={`/app/jobs/${job.id}`}
										className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
									>
										<div className="flex items-center gap-2 min-w-0">
											<Icon
												className={cn(
													"h-4 w-4 shrink-0",
													cfg.className,
												)}
											/>
											<span className="truncate text-sm font-medium">
												{slugToName(job.toolSlug)}
											</span>
											<span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
												{cfg.label}
											</span>
										</div>
										<span className="shrink-0 text-xs text-muted-foreground ml-2">
											{formatRelative(job.createdAt)}
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				)}

				{jobs.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="w-full"
						asChild
					>
						<Link href="/app/jobs">View all jobs →</Link>
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
