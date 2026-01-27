"use client";

import { Pagination } from "@saas/shared/components/Pagination";
import { Spinner } from "@shared/components/Spinner";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	Loader2,
	Newspaper,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import {
	filterJobsBySearch,
	filterJobsByStatus,
	getArticleTitle,
	type JobStatus,
	type NewsAnalyzerJob,
	paginateJobs,
	statusConfig,
} from "./lib/history-utils";

const ITEMS_PER_PAGE = 10;

const statusIcons: Record<
	JobStatus,
	React.ComponentType<{ className?: string }>
> = {
	PENDING: Clock,
	PROCESSING: Loader2,
	COMPLETED: CheckCircle2,
	FAILED: XCircle,
	CANCELLED: AlertCircle,
};

function StatusBadge({ status }: { status: JobStatus }) {
	const config = statusConfig[status];
	const Icon = statusIcons[status];
	const isProcessing = status === "PROCESSING" || status === "PENDING";

	return (
		<Badge
			status={
				config.variant === "success"
					? "success"
					: config.variant === "error"
						? "error"
						: config.variant === "warning"
							? "warning"
							: "info"
			}
			className={isProcessing ? "motion-safe:animate-pulse" : ""}
		>
			<Icon
				className={`size-3 mr-1 ${status === "PROCESSING" ? "animate-spin" : ""}`}
			/>
			{config.label}
		</Badge>
	);
}

export function NewsAnalyzerHistory() {
	const [currentPage, setCurrentPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsString.withDefault(""),
	);

	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(
		searchTerm,
		300,
		{ leading: true, trailing: false },
	);

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm, setDebouncedSearchTerm]);

	// Get session ID for anonymous users
	const sessionId = useMemo(() => {
		if (typeof window === "undefined") return undefined;
		return localStorage.getItem("news-analyzer-session-id") ?? undefined;
	}, []);

	const { data, isLoading, refetch } = useQuery({
		...orpc.jobs.list.queryOptions({
			input: {
				toolSlug: "news-analyzer",
				limit: 100, // Fetch more for client-side filtering
				offset: 0,
			},
		}),
		// Add session ID header for anonymous users
		meta: sessionId
			? { headers: { "x-session-id": sessionId } }
			: undefined,
	});

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm, statusFilter, setCurrentPage]);

	// Client-side filtering
	const filteredJobs = useMemo(() => {
		let jobs = (data?.jobs ?? []) as NewsAnalyzerJob[];
		jobs = filterJobsBySearch(jobs, debouncedSearchTerm);
		jobs = filterJobsByStatus(jobs, statusFilter as JobStatus | "");
		return jobs;
	}, [data?.jobs, debouncedSearchTerm, statusFilter]);

	// Pagination
	const paginatedJobs = useMemo(() => {
		return paginateJobs(filteredJobs, currentPage, ITEMS_PER_PAGE);
	}, [filteredJobs, currentPage]);

	const columns: ColumnDef<NewsAnalyzerJob>[] = useMemo(
		() => [
			{
				accessorKey: "createdAt",
				header: "Date",
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground whitespace-nowrap">
						{new Date(row.original.createdAt).toLocaleDateString()}
						<br />
						<span className="text-xs">
							{new Date(
								row.original.createdAt,
							).toLocaleTimeString()}
						</span>
					</span>
				),
			},
			{
				accessorKey: "input",
				header: "Article",
				cell: ({ row }) => {
					const { input } = row.original;
					const title = getArticleTitle(input);
					const isUrl = !!input.articleUrl;

					return (
						<div className="flex items-center gap-2 max-w-[300px]">
							{isUrl ? (
								<ExternalLink className="size-4 text-muted-foreground flex-shrink-0" />
							) : (
								<FileText className="size-4 text-muted-foreground flex-shrink-0" />
							)}
							<span
								className="text-sm truncate"
								title={input.articleUrl ?? input.articleText}
							>
								{title}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const job = row.original;
					const canView =
						job.status === "COMPLETED" || job.status === "FAILED";

					return (
						<div className="flex justify-end">
							{canView && (
								<Button variant="ghost" size="sm" asChild>
									<Link
										href={`/app/tools/news-analyzer/${job.id}`}
									>
										View
									</Link>
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[],
	);

	const table = useReactTable({
		data: paginatedJobs,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	});

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="font-semibold text-xl">Analysis History</h2>
				<Button variant="outline" size="sm" onClick={() => refetch()}>
					Refresh
				</Button>
			</div>

			<div className="flex flex-wrap gap-4 mb-4">
				<Input
					type="search"
					placeholder="Search by article title or URL..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>

				<Select
					value={statusFilter}
					onValueChange={(value) =>
						setStatusFilter(value === "all" ? "" : value)
					}
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
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="cursor-pointer transition-colors duration-150 hover:bg-muted/50"
									onClick={() => {
										const job = row.original;
										if (
											job.status === "COMPLETED" ||
											job.status === "FAILED"
										) {
											window.location.href = `/app/tools/news-analyzer/${job.id}`;
										}
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{isLoading ? (
										<div className="flex h-full items-center justify-center">
											<Spinner className="mr-2 size-4 text-primary" />
											Loading history...
										</div>
									) : filteredJobs.length === 0 &&
										(debouncedSearchTerm ||
											statusFilter) ? (
										<div className="text-muted-foreground">
											<p>
												No analyses match your search
												criteria.
											</p>
											<Button
												variant="link"
												className="mt-2"
												onClick={() => {
													setSearchTerm("");
													setStatusFilter("");
												}}
											>
												Clear filters
											</Button>
										</div>
									) : (
										<div className="flex flex-col items-center py-8 text-center">
											<div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
												<Newspaper className="size-8 text-muted-foreground" />
											</div>
											<h3 className="font-semibold text-foreground">
												No analyses yet
											</h3>
											<p className="mt-1 text-sm text-muted-foreground max-w-xs">
												Analyze your first article to
												see your results history here.
											</p>
										</div>
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{filteredJobs.length > ITEMS_PER_PAGE && (
				<Pagination
					className="mt-4"
					totalItems={filteredJobs.length}
					itemsPerPage={ITEMS_PER_PAGE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}
		</Card>
	);
}
