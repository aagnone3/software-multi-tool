"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { EmptyStateUpgradeNudge } from "@saas/shared/components/EmptyStateUpgradeNudge";
import { useDebounce } from "@shared/hooks/use-debounce";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobsListPaginated } from "@tools/hooks/use-job-polling";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import {
	CheckCircle2Icon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ClockIcon,
	DownloadIcon,
	ExternalLinkIcon,
	Loader2Icon,
	RefreshCwIcon,
	Trash2Icon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

type JobStatus =
	| "PENDING"
	| "PROCESSING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

const STATUS_CONFIG: Record<
	JobStatus,
	{ label: string; status: "success" | "error" | "warning" | "info" }
> = {
	PENDING: { label: "Pending", status: "warning" },
	PROCESSING: { label: "Processing", status: "info" },
	COMPLETED: { label: "Completed", status: "success" },
	FAILED: { label: "Failed", status: "error" },
	CANCELLED: { label: "Cancelled", status: "warning" },
};

const STATUS_ICONS: Record<
	JobStatus,
	React.ComponentType<{ className?: string }>
> = {
	PENDING: ClockIcon,
	PROCESSING: Loader2Icon,
	COMPLETED: CheckCircle2Icon,
	FAILED: XCircleIcon,
	CANCELLED: XCircleIcon,
};

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleString();
}

function formatDuration(
	createdAt: Date | string,
	completedAt?: Date | string | null,
): string {
	if (!completedAt) {
		return "—";
	}
	const ms = new Date(completedAt).getTime() - new Date(createdAt).getTime();
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	if (m > 0) {
		return `${m}m ${s % 60}s`;
	}
	return `${s}s`;
}

interface ToolHistoryPageProps {
	toolSlug: string;
	toolName: string;
}

export function ToolHistoryPage({ toolSlug, toolName }: ToolHistoryPageProps) {
	const { activeOrganization } = useActiveOrganization();
	const { track } = useProductAnalytics();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const debouncedSearch = useDebounce(search, 300);
	const queryClient = useQueryClient();

	useEffect(() => {
		track({
			name: "tool_history_page_viewed",
			props: { tool_slug: toolSlug },
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [toolSlug]);

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearch, statusFilter, fromDate, toDate]);

	const offset = (currentPage - 1) * ITEMS_PER_PAGE;
	const { jobs, isLoading, hasMore } = useJobsListPaginated({
		toolSlug,
		limit: ITEMS_PER_PAGE,
		offset,
	});

	const filtered = useMemo(() => {
		if (!jobs) {
			return [];
		}
		return jobs.filter((job) => {
			if (statusFilter !== "ALL" && job.status !== statusFilter) {
				return false;
			}
			if (fromDate && new Date(job.createdAt) < new Date(fromDate)) {
				return false;
			}
			if (
				toDate &&
				new Date(job.createdAt) > new Date(`${toDate}T23:59:59`)
			) {
				return false;
			}
			if (
				debouncedSearch &&
				!job.id.toLowerCase().includes(debouncedSearch.toLowerCase())
			) {
				return false;
			}
			return true;
		});
	}, [jobs, statusFilter, fromDate, toDate, debouncedSearch]);

	const hasFilters =
		statusFilter !== "ALL" || fromDate || toDate || debouncedSearch;

	const clearFilters = useCallback(() => {
		setSearch("");
		setStatusFilter("ALL");
		setFromDate("");
		setToDate("");
	}, []);

	const exportCsv = useCallback(() => {
		if (!filtered.length) {
			return;
		}
		const rows = [
			["ID", "Status", "Created At", "Completed At", "Duration"],
			...filtered.map((job) => [
				job.id,
				job.status,
				formatDate(job.createdAt),
				job.completedAt ? formatDate(job.completedAt) : "",
				formatDuration(job.createdAt, job.completedAt),
			]),
		];
		const csv = rows
			.map((r) => r.map((c) => `"${c}"`).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${toolSlug}-history.csv`;
		a.click();
		URL.revokeObjectURL(url);
		track({
			name: "tool_history_csv_exported",
			props: { tool_slug: toolSlug, row_count: filtered.length },
		});
	}, [filtered, toolSlug, track]);

	const { mutate: deleteJob } = useMutation({
		mutationFn: (jobId: string) => orpcClient.jobs.delete({ jobId }),
		onSuccess: (_data, jobId) => {
			queryClient.invalidateQueries({ queryKey: orpc.jobs.list.key() });
			toast.success("Job deleted");
			track({
				name: "tool_history_job_deleted",
				props: { tool_slug: toolSlug, job_id: jobId },
			});
		},
		onError: () => toast.error("Failed to delete job"),
	});

	const stats = useMemo(() => {
		if (!jobs) {
			return null;
		}
		const total = jobs.length;
		const completed = jobs.filter((j) => j.status === "COMPLETED").length;
		const failed = jobs.filter((j) => j.status === "FAILED").length;
		const successRate =
			total > 0 ? Math.round((completed / total) * 100) : 0;
		return { total, completed, failed, successRate };
	}, [jobs]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">
						{toolName} — Run History
					</h1>
					<p className="text-muted-foreground text-sm">
						All jobs run with this tool
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/app/tools/${toolSlug}`}>
							<ExternalLinkIcon className="mr-1 h-4 w-4" />
							Open Tool
						</Link>
					</Button>
					{filtered.length > 0 && (
						<UpgradeGate
							featureName="Tool History Export"
							description="Export your tool run history to CSV."
						>
							<Button
								variant="outline"
								size="sm"
								onClick={exportCsv}
							>
								<DownloadIcon className="mr-1 h-4 w-4" />
								Export CSV
							</Button>
						</UpgradeGate>
					)}
				</div>
			</div>

			{stats && (
				<div className="grid grid-cols-4 gap-4">
					<Card>
						<CardHeader className="pb-1">
							<CardTitle className="text-muted-foreground text-xs uppercase">
								Total Runs
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">{stats.total}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1">
							<CardTitle className="text-muted-foreground text-xs uppercase">
								Completed
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-green-600">
								{stats.completed}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1">
							<CardTitle className="text-muted-foreground text-xs uppercase">
								Failed
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-red-600">
								{stats.failed}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1">
							<CardTitle className="text-muted-foreground text-xs uppercase">
								Success Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{stats.successRate}%
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Runs</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Input
							placeholder="Search by job ID..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-48"
						/>
						<select
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(
									e.target.value as JobStatus | "ALL",
								)
							}
							className="h-8 rounded-md border px-2 text-sm"
						>
							<option value="ALL">All statuses</option>
							{(
								[
									"COMPLETED",
									"FAILED",
									"PENDING",
									"PROCESSING",
									"CANCELLED",
								] as JobStatus[]
							).map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
						<Input
							type="date"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
							className="h-8 w-36"
							placeholder="From"
						/>
						<Input
							type="date"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
							className="h-8 w-36"
							placeholder="To"
						/>
						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
							>
								Clear filters
							</Button>
						)}
					</div>

					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }, (_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					) : filtered.length === 0 ? (
						<div className="flex flex-col items-center py-12 text-center text-muted-foreground">
							{hasFilters
								? "No jobs match your filters."
								: "No runs yet for this tool."}
							{!hasFilters && (
								<EmptyStateUpgradeNudge
									organizationId={activeOrganization?.id}
									context="tool"
									className="max-w-lg mt-4"
								/>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-left text-muted-foreground">
											<th className="pb-2 pr-4 font-medium">
												Job ID
											</th>
											<th className="pb-2 pr-4 font-medium">
												Status
											</th>
											<th className="pb-2 pr-4 font-medium">
												Created
											</th>
											<th className="pb-2 pr-4 font-medium">
												Duration
											</th>
											<th className="pb-2 font-medium">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{filtered.map((job) => {
											const status = (job.status ??
												"PENDING") as JobStatus;
											const cfg =
												STATUS_CONFIG[status] ??
												STATUS_CONFIG.PENDING;
											const Icon =
												STATUS_ICONS[status] ??
												ClockIcon;
											return (
												<tr
													key={job.id}
													className="group"
												>
													<td className="py-2 pr-4 font-mono text-xs">
														<Link
															href={`/app/jobs/${job.id}`}
															className="hover:underline"
														>
															{job.id.slice(0, 8)}
															…
														</Link>
													</td>
													<td className="py-2 pr-4">
														<Badge
															status={cfg.status}
															className="flex w-fit items-center gap-1"
														>
															<Icon className="h-3 w-3" />
															{cfg.label}
														</Badge>
													</td>
													<td className="py-2 pr-4 text-muted-foreground">
														{formatDate(
															job.createdAt,
														)}
													</td>
													<td className="py-2 pr-4 text-muted-foreground">
														{formatDuration(
															job.createdAt,
															job.completedAt,
														)}
													</td>
													<td className="py-2">
														<div className="flex items-center gap-1">
															<Button
																size="sm"
																variant="ghost"
																asChild
															>
																<Link
																	href={`/app/jobs/${job.id}`}
																>
																	View
																</Link>
															</Button>
															<Button
																size="sm"
																variant="ghost"
																asChild
																className="text-muted-foreground"
															>
																<Link
																	href={`/app/tools/${toolSlug}`}
																>
																	<RefreshCwIcon className="h-3 w-3" />
																</Link>
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="text-destructive opacity-0 group-hover:opacity-100"
																onClick={() =>
																	deleteJob(
																		job.id,
																	)
																}
															>
																<Trash2Icon className="h-3 w-3" />
															</Button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							{/* Pagination controls */}
							{(currentPage > 1 || hasMore) && (
								<div className="flex items-center justify-between border-t pt-3">
									<p className="text-muted-foreground text-sm">
										Page {currentPage}
									</p>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setCurrentPage((p) =>
													Math.max(1, p - 1),
												)
											}
											disabled={currentPage === 1}
											aria-label="Previous page"
										>
											<ChevronLeftIcon className="h-4 w-4" />
											Previous
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setCurrentPage((p) => p + 1)
											}
											disabled={!hasMore}
											aria-label="Next page"
										>
											Next
											<ChevronRightIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
