"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	ArrowLeftIcon,
	ArrowRightLeftIcon,
	ClockIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { SmartOutputRenderer } from "./SmartOutputRenderer";

interface JobSummary {
	id: string;
	toolSlug: string;
	status: string;
	createdAt: Date | string;
	completedAt?: Date | string | null;
}

function getToolName(toolSlug: string): string {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.name ?? toolSlug;
}

function formatDateTime(dateString: Date | string): string {
	return new Date(dateString).toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function JobSelector({
	label,
	jobs,
	selectedJobId,
	onSelect,
}: {
	label: string;
	jobs: JobSummary[];
	selectedJobId: string | null;
	onSelect: (id: string) => void;
}) {
	const completedJobs = jobs.filter((j) => j.status === "COMPLETED");

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-2">
				{completedJobs.length === 0 ? (
					<p className="text-sm text-muted-foreground py-2 text-center">
						No completed jobs yet
					</p>
				) : (
					completedJobs.map((job) => (
						<button
							key={job.id}
							type="button"
							className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
								selectedJobId === job.id
									? "bg-primary text-primary-foreground"
									: "hover:bg-muted"
							}`}
							onClick={() => onSelect(job.id)}
						>
							<div className="flex items-center justify-between gap-2">
								<span className="font-mono text-xs truncate opacity-60">
									{job.id.slice(0, 8)}…
								</span>
								<span className="flex items-center gap-1 text-xs opacity-70 shrink-0">
									<ClockIcon className="size-3" />
									{formatDateTime(job.createdAt)}
								</span>
							</div>
						</button>
					))
				)}
			</div>
		</div>
	);
}

function JobOutputPanel({
	jobId,
	label,
}: {
	jobId: string | null;
	label: string;
}) {
	const { data: jobData, isLoading } = useQuery({
		queryKey: ["job-compare", jobId],
		queryFn: () => orpcClient.jobs.get({ jobId: jobId as string }),
		enabled: Boolean(jobId),
	});
	const job = jobData?.job;

	if (!jobId) {
		return (
			<Card className="h-full min-h-48 border-dashed">
				<CardContent className="flex h-full items-center justify-center py-12">
					<p className="text-sm text-muted-foreground">
						{label}: select a job above
					</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<Skeleton className="h-5 w-24" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!jobData || !job) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-sm text-muted-foreground">
					Job not found
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<WrenchIcon className="size-4 text-primary" />
					{getToolName(job.toolSlug)}
					<span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
						{job.id.slice(0, 8)}…
					</span>
				</CardTitle>
				<p className="text-xs text-muted-foreground">
					{formatDateTime(job.createdAt)}
				</p>
			</CardHeader>
			<CardContent>
				{job.output ? (
					<SmartOutputRenderer
						output={job.output}
						toolSlug={job.toolSlug}
					/>
				) : (
					<p className="text-sm text-muted-foreground italic">
						No output available
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export function JobOutputCompare() {
	const [leftJobId, setLeftJobId] = useState<string | null>(null);
	const [rightJobId, setRightJobId] = useState<string | null>(null);
	const { track } = useProductAnalytics();

	const { data, isLoading } = useQuery({
		queryKey: ["jobs-list-for-compare"],
		queryFn: () => orpcClient.jobs.list({ limit: 50 }),
	});

	const jobs: JobSummary[] = (data?.jobs ?? []) as unknown as JobSummary[];

	useEffect(() => {
		track({ name: "job_compare_page_viewed", props: {} });
	}, [track]);

	const handleSelectLeft = (jobId: string) => {
		setLeftJobId(jobId);
		const job = jobs.find((j) => j.id === jobId);
		if (job) {
			track({
				name: "job_compare_job_selected",
				props: {
					panel: "left",
					job_id: jobId,
					tool_slug: job.toolSlug,
				},
			});
		}
	};

	const handleSelectRight = (jobId: string) => {
		setRightJobId(jobId);
		const job = jobs.find((j) => j.id === jobId);
		if (job) {
			track({
				name: "job_compare_job_selected",
				props: {
					panel: "right",
					job_id: jobId,
					tool_slug: job.toolSlug,
				},
			});
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/app/jobs">
						<ArrowLeftIcon className="size-4 mr-1" />
						Back
					</Link>
				</Button>
				<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<ArrowRightLeftIcon className="size-4" />
				</div>
				<div>
					<h1 className="text-xl font-semibold">Compare Outputs</h1>
					<p className="text-sm text-muted-foreground">
						Select two completed jobs to compare their outputs
					</p>
				</div>
			</div>

			{/* Job selectors */}
			{isLoading ? (
				<div className="grid gap-4 lg:grid-cols-2">
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-32 w-full" />
				</div>
			) : (
				<div className="grid gap-4 lg:grid-cols-2">
					<JobSelector
						label="Left panel"
						jobs={jobs}
						selectedJobId={leftJobId}
						onSelect={handleSelectLeft}
					/>
					<JobSelector
						label="Right panel"
						jobs={jobs}
						selectedJobId={rightJobId}
						onSelect={handleSelectRight}
					/>
				</div>
			)}

			{/* Output panels */}
			<div className="grid gap-4 lg:grid-cols-2">
				<JobOutputPanel jobId={leftJobId} label="Left panel" />
				<JobOutputPanel jobId={rightJobId} label="Right panel" />
			</div>
		</div>
	);
}
