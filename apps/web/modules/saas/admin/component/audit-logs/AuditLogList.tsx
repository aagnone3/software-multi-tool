"use client";

import { Pagination } from "@saas/shared/components/Pagination";
import { Spinner } from "@shared/components/Spinner";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
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
import { CheckCircle2Icon, DownloadIcon, XCircleIcon } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";

const ITEMS_PER_PAGE = 25;

type AuditAction =
	| "CREATE"
	| "READ"
	| "UPDATE"
	| "DELETE"
	| "LOGIN"
	| "LOGOUT"
	| "PASSWORD_CHANGE"
	| "MFA_SETUP"
	| "MFA_DISABLE"
	| "IMPERSONATE"
	| "INVITE"
	| "EXPORT"
	| "SUBSCRIPTION_CHANGE"
	| "PAYMENT";

const actionLabels: Record<AuditAction, string> = {
	CREATE: "Create",
	READ: "Read",
	UPDATE: "Update",
	DELETE: "Delete",
	LOGIN: "Login",
	LOGOUT: "Logout",
	PASSWORD_CHANGE: "Password Change",
	MFA_SETUP: "MFA Setup",
	MFA_DISABLE: "MFA Disable",
	IMPERSONATE: "Impersonate",
	INVITE: "Invite",
	EXPORT: "Export",
	SUBSCRIPTION_CHANGE: "Subscription Change",
	PAYMENT: "Payment",
};

interface AuditLog {
	id: string;
	createdAt: Date;
	userId: string | null;
	organizationId: string | null;
	action: AuditAction;
	resource: string;
	resourceId: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	sessionId: string | null;
	success: boolean;
	metadata: unknown;
}

export function AuditLogList() {
	const [currentPage, setCurrentPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);
	const [actionFilter, setActionFilter] = useQueryState(
		"action",
		parseAsString.withDefault(""),
	);
	const [resourceFilter, setResourceFilter] = useQueryState(
		"resource",
		parseAsString.withDefault(""),
	);
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsString.withDefault(""),
	);

	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(
		searchTerm,
		300,
		{
			leading: true,
			trailing: false,
		},
	);

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm, setDebouncedSearchTerm]);

	const { data: filtersData } = useQuery(
		orpc.admin.auditLogs.filters.queryOptions({ input: {} }),
	);

	const { data, isLoading } = useQuery(
		orpc.admin.auditLogs.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				search: debouncedSearchTerm || undefined,
				action: (actionFilter as AuditAction) || undefined,
				resource: resourceFilter || undefined,
				success:
					statusFilter === ""
						? undefined
						: statusFilter === "success",
			},
		}),
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [
		debouncedSearchTerm,
		actionFilter,
		resourceFilter,
		statusFilter,
		setCurrentPage,
	]);

	const handleExport = async (format: "json" | "csv") => {
		const toastId = toast.loading("Exporting...");

		try {
			const response = await orpc.admin.auditLogs.export.call({
				format,
				action: (actionFilter as AuditAction) || undefined,
				resource: resourceFilter || undefined,
				success:
					statusFilter === ""
						? undefined
						: statusFilter === "success",
			});

			const blob = new Blob(
				[
					format === "json"
						? JSON.stringify(response.data, null, 2)
						: (response.data as string),
				],
				{ type: format === "json" ? "application/json" : "text/csv" },
			);

			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = response.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success("Export successful.", { id: toastId });
		} catch {
			toast.error("Export failed.", { id: toastId });
		}
	};

	const columns: ColumnDef<AuditLog>[] = useMemo(
		() => [
			{
				accessorKey: "createdAt",
				header: "Timestamp",
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground whitespace-nowrap">
						{new Date(row.original.createdAt).toLocaleString()}
					</span>
				),
			},
			{
				accessorKey: "action",
				header: "Action",
				cell: ({ row }) => (
					<Badge status="info">
						{actionLabels[row.original.action]}
					</Badge>
				),
			},
			{
				accessorKey: "resource",
				header: "Resource",
				cell: ({ row }) => (
					<span className="font-medium capitalize">
						{row.original.resource}
						{row.original.resourceId && (
							<span className="text-muted-foreground ml-1 text-xs">
								({row.original.resourceId.slice(0, 8)}...)
							</span>
						)}
					</span>
				),
			},
			{
				accessorKey: "userId",
				header: "User",
				cell: ({ row }) => (
					<span className="text-sm">
						{row.original.userId ? (
							<span className="text-muted-foreground">
								{row.original.userId.slice(0, 8)}...
							</span>
						) : (
							<span className="text-muted-foreground italic">
								System
							</span>
						)}
					</span>
				),
			},
			{
				accessorKey: "ipAddress",
				header: "IP Address",
				cell: ({ row }) => (
					<span className="font-mono text-sm text-muted-foreground">
						{row.original.ipAddress || "-"}
					</span>
				),
			},
			{
				accessorKey: "success",
				header: "Status",
				cell: ({ row }) =>
					row.original.success ? (
						<CheckCircle2Icon className="size-4 text-green-500" />
					) : (
						<XCircleIcon className="size-4 text-red-500" />
					),
			},
		],
		[],
	);

	const logs = useMemo(() => (data?.logs ?? []) as AuditLog[], [data?.logs]);

	const table = useReactTable({
		data: logs,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
	});

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="font-semibold text-2xl">Audit Logs</h2>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<DownloadIcon className="size-4 mr-2" />
							Export
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={() => handleExport("json")}>
							Export as JSON
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleExport("csv")}>
							Export as CSV
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex flex-wrap gap-4 mb-4">
				<Input
					type="search"
					placeholder="Search..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-xs"
				/>

				<Select
					value={actionFilter}
					onValueChange={(value) =>
						setActionFilter(value === "all" ? "" : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All Actions" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Actions</SelectItem>
						{filtersData?.actions.map((action) => (
							<SelectItem key={action} value={action}>
								{actionLabels[action as AuditAction]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={resourceFilter}
					onValueChange={(value) =>
						setResourceFilter(value === "all" ? "" : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All Resources" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Resources</SelectItem>
						{filtersData?.resources.map((resource: string) => (
							<SelectItem key={resource} value={resource}>
								{resource}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

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
						<SelectItem value="success">Successful</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
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
									data-state={
										row.getIsSelected() && "selected"
									}
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
											Loading audit logs...
										</div>
									) : (
										<p>No results.</p>
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{data?.total && data.total > ITEMS_PER_PAGE && (
				<Pagination
					className="mt-4"
					totalItems={data.total}
					itemsPerPage={ITEMS_PER_PAGE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}
		</Card>
	);
}
