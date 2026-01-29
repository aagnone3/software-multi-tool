"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type {
	ColumnDef,
	PaginationState,
	RowSelectionState,
	SortingState,
	Table,
	VisibilityState,
} from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";

export interface ServerPaginationParams {
	page: number;
	pageSize: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface ServerPaginationResult<TData> {
	data: TData[];
	totalCount: number;
	pageCount: number;
}

export interface UseDataTableQueryOptions<TData, TQueryData> {
	columns: ColumnDef<TData, unknown>[];
	queryResult: UseQueryResult<TQueryData, unknown>;
	getRows: (data: TQueryData | undefined) => TData[];
	getTotalCount: (data: TQueryData | undefined) => number;
	pageSize?: number;
	enableRowSelection?: boolean;
	enableColumnVisibility?: boolean;
	initialColumnVisibility?: VisibilityState;
	initialRowSelection?: RowSelectionState;
	onSortingChange?: (sorting: SortingState) => void;
	onPaginationChange?: (pagination: PaginationState) => void;
	onRowSelectionChange?: (selection: RowSelectionState) => void;
	getRowId?: (row: TData) => string;
}

export interface UseDataTableQueryReturn<TData> {
	table: Table<TData>;
	sorting: SortingState;
	columnVisibility: VisibilityState;
	rowSelection: RowSelectionState;
	pagination: PaginationState;
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	totalCount: number;
	pageCount: number;
}

export function useDataTableQuery<TData, TQueryData>({
	columns,
	queryResult,
	getRows,
	getTotalCount,
	pageSize = 10,
	enableRowSelection = false,
	enableColumnVisibility = true,
	initialColumnVisibility = {},
	initialRowSelection = {},
	onSortingChange,
	onPaginationChange,
	onRowSelectionChange,
	getRowId,
}: UseDataTableQueryOptions<
	TData,
	TQueryData
>): UseDataTableQueryReturn<TData> {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		initialColumnVisibility,
	);
	const [rowSelection, setRowSelection] =
		useState<RowSelectionState>(initialRowSelection);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize,
	});

	const { data: queryData, isLoading, isError, error } = queryResult;

	const data = useMemo(() => getRows(queryData), [queryData, getRows]);

	const totalCount = useMemo(
		() => getTotalCount(queryData),
		[queryData, getTotalCount],
	);

	const pageCount = useMemo(
		() => Math.ceil(totalCount / pagination.pageSize),
		[totalCount, pagination.pageSize],
	);

	const handleSortingChange = (
		updater: SortingState | ((old: SortingState) => SortingState),
	) => {
		const newSorting =
			typeof updater === "function" ? updater(sorting) : updater;
		setSorting(newSorting);
		onSortingChange?.(newSorting);
	};

	const handlePaginationChange = (
		updater: PaginationState | ((old: PaginationState) => PaginationState),
	) => {
		const newPagination =
			typeof updater === "function" ? updater(pagination) : updater;
		setPagination(newPagination);
		onPaginationChange?.(newPagination);
	};

	const handleRowSelectionChange = (
		updater:
			| RowSelectionState
			| ((old: RowSelectionState) => RowSelectionState),
	) => {
		const newSelection =
			typeof updater === "function" ? updater(rowSelection) : updater;
		setRowSelection(newSelection);
		onRowSelectionChange?.(newSelection);
	};

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			pagination,
		},
		enableRowSelection,
		enableHiding: enableColumnVisibility,
		manualPagination: true,
		manualSorting: true,
		pageCount,
		onSortingChange: handleSortingChange,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: handleRowSelectionChange,
		onPaginationChange: handlePaginationChange,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
	});

	return {
		table,
		sorting,
		columnVisibility,
		rowSelection,
		pagination,
		isLoading,
		isError,
		error,
		totalCount,
		pageCount,
	};
}
