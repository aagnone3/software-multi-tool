"use client";

import type {
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	RowSelectionState,
	SortingState,
	Table,
	VisibilityState,
} from "@tanstack/react-table";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

export interface UseDataTableOptions<TData> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	pageSize?: number;
	enableSorting?: boolean;
	enableFiltering?: boolean;
	enablePagination?: boolean;
	enableRowSelection?: boolean;
	enableColumnVisibility?: boolean;
	manualPagination?: boolean;
	manualSorting?: boolean;
	manualFiltering?: boolean;
	pageCount?: number;
	initialSorting?: SortingState;
	initialColumnFilters?: ColumnFiltersState;
	initialColumnVisibility?: VisibilityState;
	initialRowSelection?: RowSelectionState;
	onSortingChange?: (sorting: SortingState) => void;
	onPaginationChange?: (pagination: PaginationState) => void;
	onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
	onRowSelectionChange?: (selection: RowSelectionState) => void;
	getRowId?: (row: TData) => string;
}

export interface UseDataTableReturn<TData> {
	table: Table<TData>;
	sorting: SortingState;
	columnFilters: ColumnFiltersState;
	columnVisibility: VisibilityState;
	rowSelection: RowSelectionState;
	pagination: PaginationState;
}

export function useDataTable<TData>({
	data,
	columns,
	pageSize = 10,
	enableSorting = true,
	enableFiltering = true,
	enablePagination = true,
	enableRowSelection = false,
	enableColumnVisibility = true,
	manualPagination = false,
	manualSorting = false,
	manualFiltering = false,
	pageCount,
	initialSorting = [],
	initialColumnFilters = [],
	initialColumnVisibility = {},
	initialRowSelection = {},
	onSortingChange,
	onPaginationChange,
	onColumnFiltersChange,
	onRowSelectionChange,
	getRowId,
}: UseDataTableOptions<TData>): UseDataTableReturn<TData> {
	const [sorting, setSorting] = useState<SortingState>(initialSorting);
	const [columnFilters, setColumnFilters] =
		useState<ColumnFiltersState>(initialColumnFilters);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		initialColumnVisibility,
	);
	const [rowSelection, setRowSelection] =
		useState<RowSelectionState>(initialRowSelection);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize,
	});

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

	const handleColumnFiltersChange = (
		updater:
			| ColumnFiltersState
			| ((old: ColumnFiltersState) => ColumnFiltersState),
	) => {
		const newFilters =
			typeof updater === "function" ? updater(columnFilters) : updater;
		setColumnFilters(newFilters);
		onColumnFiltersChange?.(newFilters);
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
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
		enableSorting,
		enableFilters: enableFiltering,
		enableColumnFilters: enableFiltering,
		enableRowSelection,
		enableHiding: enableColumnVisibility,
		manualPagination,
		manualSorting,
		manualFiltering,
		pageCount: manualPagination ? pageCount : undefined,
		onSortingChange: handleSortingChange,
		onColumnFiltersChange: handleColumnFiltersChange,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: handleRowSelectionChange,
		onPaginationChange: handlePaginationChange,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel:
			enableSorting && !manualSorting ? getSortedRowModel() : undefined,
		getFilteredRowModel:
			enableFiltering && !manualFiltering
				? getFilteredRowModel()
				: undefined,
		getPaginationRowModel:
			enablePagination && !manualPagination
				? getPaginationRowModel()
				: undefined,
		getRowId,
	});

	return {
		table,
		sorting,
		columnFilters,
		columnVisibility,
		rowSelection,
		pagination,
	};
}
