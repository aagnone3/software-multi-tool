"use client";

import { config } from "@repo/config";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertCircleIcon,
	BriefcaseIcon,
	CheckCircle2Icon,
	ClockIcon,
	ExternalLinkIcon,
	Loader2Icon,
	RefreshCwIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

const STATUS_CONFIG: Record<
	JobStatus,
	{ label: string; variant: "success" | "error" | "warning" | "info" }
> = {
	PENDING: { label: "Pending", variant: "warning" },
	PROCESSING: { label: "Processing", variant: "info" },
	COMPLETED: { label: "Completed", variant: "success" },
	FAILED: { label: "Failed", variant: "error" },
	CANCELLED: { label: "Cancelled", variant: "warning" },
};

const STATUS_ICONS: Record<
	JobStatus,
	React.ComponentType<{ className?: string }>
> = {
	PENDING: ClockIcon,
	PROCESSING: Loader2Icon,
	COMPLETED: CheckCircle2Icon,
	FAILED: XCircleIcon,
	CANCELLED: AlertCircleIcon,
};

function getToolName(toolSlug: string): string {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.name ?? toolSlug;
}

function getJobDetailUrl(toolSlug: string, jobId: string): string | null {
	// Only tools with dedicated detail pages
	const detailRouteTools: Record<string, string> = {
		"news-analyzer": `/app/tools/news-analyzer/${jobId}`,
		"speaker-separation": `/app/tools/speaker-separation/${jobId}`,
	};
	return detailRouteTools[toolSlug] ?? null;
}

function formatDateTime(dateString: string): { date: string; time: string } {
	const date = new Date(dateString);
	return {
		date: date.toLocaleDateString(),
		time: date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		}),
	};
}

function StatusBadge({ status }: { status: JobStatus }) {
	const statusConfig = STATUS_CONFIG[status];
	const Icon = STATUS_ICONS[status];
	const isAnimated = status === "PROCESSING" || status === "PENDING";

	return (
		<Badge
			status={statusConfig.variant}
			className={isAnimated ? "motion-safe:animate-pulse" : ""}
		>
			<Icon
				className={`size-3 mr-1 ${status === "PROCESSING" ? "animate-spin" : ""}`}
			/>
			{statusConfig.label}
		</Badge>
	);
}

interface Job {
	id: string;
	toolSlug: string;
	status: JobStatus;
	createdAt: string;
	completedAt?: string | null;
}

function JobRow({ job }: { job: Job }) {
	const { date, time } = formatDateTime(job.createdAt);
	const toolName = getToolName(job.toolSlug);
	const detailUrl = getJobDetailUrl(job.toolSlug, job.id);
	const canView = job.status === "COMPLETED" || job.status === "FAILED";

	return (
		<div className="flex items-center gap-4 py-3 border-b last:border-b-0 hover:bg-muted/30 px-4 rounded-lg transition-colors">
			<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
				<WrenchIcon className="size-4" />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-sm font-medium">{toolName}</span>
					<StatusBadge status={job.status} />
				</div>
				<div className="text-xs text-muted-foreground mt-0.5">
					{date} at {time}
					{job.completedAt && (
						<span className="ml-2 text-xs">
							· Completed {formatDateTime(job.completedAt).time}
						</span>
					)}
				</div>
			</div>

			<div className="shrink-0">
				{canView && detailUrl ? (
					<Button variant="ghost" size="sm" asChild>
						<Link href={detailUrl}>
							<ExternalLinkIcon className="size-3 mr-1" />
							View
						</Link>
					</Button>
				) : (
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/app/tools/${job.toolSlug}`}>
							Open Tool
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
	if (hasFilters) {
		return (
			<div className="flex flex-col items-center py-12 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
					<BriefcaseIcon className="size-8 text-muted-foreground" />
				</div>
				<h3 className="font-semibold text-foreground">
					No jobs match your filters
				</h3>
				<p className="mt-1 text-sm text-muted-foreground max-w-xs">
					Try adjusting your search or filter criteria.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center py-12 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
				<BriefcaseIcon className="size-8 text-muted-foreground" />
			</div>
			<h3 className="font-semibold text-foreground">No jobs yet</h3>
			<p className="mt-1 text-sm text-muted-foreground max-w-xs">
				Your tool runs will appear here. Get started by using one of the
				available tools.
			</p>
			<Button className="mt-4" asChild>
				<Link href="/app/tools">Browse Tools</Link>
			</Button>
		</div>
	);
}

export function JobsHistoryPage() {
	const { jobs, isLoading, refetch } = useJobsList();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [toolFilter, setToolFilter] = useState<string>("");

	const typedJobs = jobs as unknown as Job[];

	const uniqueToolSlugs = useMemo(() => {
		const slugs = Array.from(new Set(typedJobs.map((j) => j.toolSlug)));
		return slugs.sort();
	}, [typedJobs]);

	const filteredJobs = useMemo(() => {
		return typedJobs.filter((job) => {
			if (statusFilter && job.status !== statusFilter) {
				return false;
			}
			if (toolFilter && job.toolSlug !== toolFilter) {
				return false;
			}
			if (search) {
				const toolName = getToolName(job.toolSlug).toLowerCase();
				if (
					!toolName.includes(search.toLowerCase()) &&
					!job.id.toLowerCase().includes(search.toLowerCase())
				) {
					return false;
				}
			}
			return true;
		});
	}, [typedJobs, statusFilter, toolFilter, search]);

	const hasFilters = Boolean(search || statusFilter || toolFilter);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Job History</h1>
					<p className="text-muted-foreground mt-1">
						All your tool runs in one place
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => refetch()}>
					<RefreshCwIcon className="size-3.5 mr-1.5" />
					Refresh
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3">
				<Input
					placeholder="Search by tool name..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-xs"
				/>

				<Select
					value={statusFilter}
					onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="COMPLETED">Completed</SelectItem>
						<SelectItem value="PROCESSING">Processing</SelectItem>
						<SelectItem value="PENDING">Pending</SelectItem>
						<SelectItem value="FAILED">Failed</SelectItem>
						<SelectItem value="CANCELLED">Cancelled</SelectItem>
					</SelectContent>
				</Select>

				{uniqueToolSlugs.length > 1 && (
					<Select
						value={toolFilter}
						onValueChange={(v) =>
							setToolFilter(v === "all" ? "" : v)
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Tools" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Tools</SelectItem>
							{uniqueToolSlugs.map((slug) => (
								<SelectItem key={slug} value={slug}>
									{getToolName(slug)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{hasFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSearch("");
							setStatusFilter("");
							setToolFilter("");
						}}
					>
						Clear filters
					</Button>
				)}
			</div>

			{/* Jobs list */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base font-medium flex items-center gap-2">
						<BriefcaseIcon className="size-4" />
						{isLoading
							? "Loading..."
							: `${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={`sk-${i}`}
									className="flex items-center gap-4 py-3"
								>
									<Skeleton className="size-9 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-32" />
									</div>
									<Skeleton className="h-8 w-16" />
								</div>
							))}
						</div>
					) : filteredJobs.length === 0 ? (
						<EmptyState hasFilters={hasFilters} />
					) : (
						<div>
							{filteredJobs.map((job) => (
								<JobRow key={job.id} job={job} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
