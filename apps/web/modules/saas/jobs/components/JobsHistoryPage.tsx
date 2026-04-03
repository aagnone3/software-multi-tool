"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { config } from "@repo/config";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { EmptyStateUpgradeNudge } from "@saas/shared/components/EmptyStateUpgradeNudge";
import { useDebounce } from "@shared/hooks/use-debounce";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobsListPaginated } from "@tools/hooks/use-job-polling";
import { useJobTags } from "@tools/hooks/use-job-tags";
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
	ArrowRightLeftIcon,
	BriefcaseIcon,
	CheckCircle2Icon,
	ClockIcon,
	DownloadIcon,
	ExternalLinkIcon,
	Loader2Icon,
	RefreshCwIcon,
	Trash2Icon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

function formatDuration(startStr: string, endStr: string): string {
	const start = new Date(startStr).getTime();
	const end = new Date(endStr).getTime();
	const secs = Math.round((end - start) / 1000);
	if (secs < 60) {
		return `${secs}s`;
	}
	const mins = Math.floor(secs / 60);
	const rem = secs % 60;
	return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
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
	output?: unknown;
}

function JobRow({
	job,
	selected,
	onToggle,
}: {
	job: Job;
	selected: boolean;
	onToggle: (id: string) => void;
}) {
	const { date, time } = formatDateTime(job.createdAt);
	const toolName = getToolName(job.toolSlug);
	const detailUrl = getJobDetailUrl(job.toolSlug, job.id);
	const canView = job.status === "COMPLETED" || job.status === "FAILED";

	return (
		<div className="flex items-center gap-4 py-3 border-b last:border-b-0 hover:bg-muted/30 px-4 rounded-lg transition-colors">
			<input
				type="checkbox"
				checked={selected}
				onChange={() => onToggle(job.id)}
				aria-label={`Select job ${job.id}`}
				className="size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
			/>
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
							{" · "}
							{formatDuration(job.createdAt, job.completedAt)}
						</span>
					)}
				</div>
			</div>

			<div className="shrink-0 flex items-center gap-1">
				{canView && detailUrl ? (
					<>
						<Button variant="ghost" size="sm" asChild>
							<Link href={detailUrl}>
								<ExternalLinkIcon className="size-3 mr-1" />
								View
							</Link>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/app/tools/${job.toolSlug}`}>
								Run Again
							</Link>
						</Button>
					</>
				) : canView ? (
					<>
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/app/jobs/${job.id}`}>
								<ExternalLinkIcon className="size-3 mr-1" />
								View
							</Link>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/app/tools/${job.toolSlug}`}>
								Run Again
							</Link>
						</Button>
					</>
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

function EmptyState({
	hasFilters,
	organizationId,
}: {
	hasFilters: boolean;
	organizationId?: string;
}) {
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
			<EmptyStateUpgradeNudge
				organizationId={organizationId}
				context="jobs"
				className="max-w-lg mt-2"
			/>
		</div>
	);
}

const PAGE_SIZE = 20;

export function JobsHistoryPage() {
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();

	useEffect(() => {
		track({ name: "jobs_history_page_viewed", props: {} });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const [pageSize, setPageSize] = useState(PAGE_SIZE);
	const { jobs, isLoading, refetch, hasMore } = useJobsListPaginated({
		limit: pageSize,
	});
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 250);
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [toolFilter, setToolFilter] = useState<string>("");
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");
	const [tagFilter, setTagFilter] = useState<string>("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const { getAllTags, getTagsForJob } = useJobTags("");
	const queryClient = useQueryClient();

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((jobId) => orpcClient.jobs.delete({ jobId })),
			);
		},
		onSuccess: (_data, ids) => {
			toast.success(
				`Deleted ${selectedIds.size} job${selectedIds.size !== 1 ? "s" : ""}`,
			);
			for (const jobId of ids) {
				track({
					name: "jobs_history_job_deleted",
					props: { job_id: jobId },
				});
			}
			setSelectedIds(new Set());
			queryClient.invalidateQueries({ queryKey: orpc.jobs.list.key() });
		},
		onError: () => {
			toast.error("Failed to delete some jobs");
		},
	});

	const typedJobs = jobs as unknown as Job[];

	const uniqueToolSlugs = useMemo(() => {
		const slugs = Array.from(new Set(typedJobs.map((j) => j.toolSlug)));
		return slugs.sort();
	}, [typedJobs]);

	const filteredJobs = useMemo(() => {
		const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
		const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
		return typedJobs.filter((job) => {
			if (statusFilter && job.status !== statusFilter) {
				return false;
			}
			if (toolFilter && job.toolSlug !== toolFilter) {
				return false;
			}
			if (fromTs !== null) {
				if (new Date(job.createdAt).getTime() < fromTs) {
					return false;
				}
			}
			if (toTs !== null) {
				if (new Date(job.createdAt).getTime() > toTs) {
					return false;
				}
			}
			if (debouncedSearch) {
				const toolName = getToolName(job.toolSlug).toLowerCase();
				if (
					!toolName.includes(debouncedSearch.toLowerCase()) &&
					!job.id
						.toLowerCase()
						.includes(debouncedSearch.toLowerCase())
				) {
					return false;
				}
			}
			if (tagFilter) {
				const jobTags = getTagsForJob(job.id);
				if (!jobTags.includes(tagFilter)) {
					return false;
				}
			}
			return true;
		});
	}, [
		typedJobs,
		statusFilter,
		toolFilter,
		dateFrom,
		dateTo,
		debouncedSearch,
		tagFilter,
		getTagsForJob,
	]);

	const availableTags = useMemo(() => getAllTags(), [getAllTags]);

	const hasFilters = Boolean(
		search || statusFilter || toolFilter || dateFrom || dateTo || tagFilter,
	);

	const exportToCsv = useCallback(() => {
		const headers = [
			"ID",
			"Tool",
			"Status",
			"Created At",
			"Completed At",
			"Duration",
		];
		const rows = filteredJobs.map((job) => {
			const duration = job.completedAt
				? formatDuration(job.createdAt, job.completedAt)
				: "";
			return [
				job.id,
				getToolName(job.toolSlug),
				job.status,
				new Date(job.createdAt).toISOString(),
				job.completedAt ? new Date(job.completedAt).toISOString() : "",
				duration,
			];
		});
		const csvContent = [headers, ...rows]
			.map((row) =>
				row
					.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
					.join(","),
			)
			.join("\n");
		const blob = new Blob([csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `job-history-${new Date().toISOString().split("T")[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
		track({
			name: "jobs_history_csv_exported",
			props: { row_count: filteredJobs.length },
		});
	}, [filteredJobs, track]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Job History</h1>
					<p className="text-muted-foreground mt-1">
						All your tool runs in one place
					</p>
				</div>
				<div className="flex items-center gap-2">
					{filteredJobs.length > 0 && (
						<UpgradeGate
							featureName="Job History Export"
							description="Export your job history to CSV for offline analysis."
						>
							<Button
								variant="outline"
								size="sm"
								onClick={exportToCsv}
							>
								<DownloadIcon className="size-3.5 mr-1.5" />
								Export CSV
							</Button>
						</UpgradeGate>
					)}
					<Button variant="outline" size="sm" asChild>
						<Link href="/app/jobs/compare">
							<ArrowRightLeftIcon className="size-3.5 mr-1.5" />
							Compare
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
					>
						<RefreshCwIcon className="size-3.5 mr-1.5" />
						Refresh
					</Button>
				</div>
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
					<SelectTrigger
						className="w-[150px]"
						aria-label="Filter by status"
					>
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
						<SelectTrigger
							className="w-[180px]"
							aria-label="Filter by tool"
						>
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

				{/* Date range */}
				<Input
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					className="w-[145px] text-sm"
					aria-label="From date"
				/>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="w-[145px] text-sm"
					aria-label="To date"
				/>

				{availableTags.length > 0 && (
					<Select
						value={tagFilter}
						onValueChange={(v) =>
							setTagFilter(v === "all" ? "" : v)
						}
					>
						<SelectTrigger
							className="w-[140px]"
							aria-label="Filter by tag"
						>
							<SelectValue placeholder="All Tags" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Tags</SelectItem>
							{availableTags.map((tag) => (
								<SelectItem key={tag} value={tag}>
									{tag}
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
							setDateFrom("");
							setDateTo("");
							setTagFilter("");
						}}
					>
						Clear filters
					</Button>
				)}
			</div>

			{/* Jobs list */}
			<Card>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base font-medium flex items-center gap-2">
							{!isLoading && filteredJobs.length > 0 && (
								<input
									type="checkbox"
									checked={
										selectedIds.size ===
											filteredJobs.length &&
										filteredJobs.length > 0
									}
									onChange={(e) => {
										if (e.target.checked) {
											setSelectedIds(
												new Set(
													filteredJobs.map(
														(j) => j.id,
													),
												),
											);
										} else {
											setSelectedIds(new Set());
										}
									}}
									aria-label="Select all jobs"
									className="size-4 cursor-pointer rounded border-border accent-primary"
								/>
							)}
							<BriefcaseIcon className="size-4" />
							{isLoading
								? "Loading..."
								: `${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
						</CardTitle>
						{selectedIds.size > 0 && (
							<Button
								variant="error"
								size="sm"
								disabled={isBulkDeleting}
								onClick={() =>
									bulkDelete(Array.from(selectedIds))
								}
							>
								{isBulkDeleting ? (
									<Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
								) : (
									<Trash2Icon className="size-3.5 mr-1.5" />
								)}
								Delete {selectedIds.size} selected
							</Button>
						)}
					</div>
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
						<EmptyState
							hasFilters={hasFilters}
							organizationId={activeOrganization?.id}
						/>
					) : (
						<div>
							{filteredJobs.map((job) => (
								<JobRow
									key={job.id}
									job={job}
									selected={selectedIds.has(job.id)}
									onToggle={toggleSelect}
								/>
							))}
							{!hasFilters && hasMore && (
								<div className="flex justify-center pt-4">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPageSize((p) => p + PAGE_SIZE)
										}
									>
										Load more
									</Button>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
