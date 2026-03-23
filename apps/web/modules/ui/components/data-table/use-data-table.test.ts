import type { ColumnDef } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTable } from "./use-data-table";

interface TestRow {
	id: string;
	name: string;
	value: number;
}

const columns: ColumnDef<TestRow, unknown>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "value", header: "Value" },
];

const data: TestRow[] = [
	{ id: "1", name: "Alpha", value: 10 },
	{ id: "2", name: "Beta", value: 20 },
	{ id: "3", name: "Gamma", value: 5 },
];

describe("useDataTable", () => {
	it("returns table and state values", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		expect(result.current.table).toBeDefined();
		expect(result.current.sorting).toEqual([]);
		expect(result.current.columnFilters).toEqual([]);
		expect(result.current.rowSelection).toEqual({});
	});

	it("uses default pageSize of 10", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		expect(result.current.pagination.pageSize).toBe(10);
	});

	it("respects custom pageSize", () => {
		const { result } = renderHook(() =>
			useDataTable({ data, columns, pageSize: 5 }),
		);
		expect(result.current.pagination.pageSize).toBe(5);
	});

	it("uses initialSorting", () => {
		const initialSorting = [{ id: "name", desc: false }];
		const { result } = renderHook(() =>
			useDataTable({ data, columns, initialSorting }),
		);
		expect(result.current.sorting).toEqual(initialSorting);
	});

	it("uses initialColumnVisibility", () => {
		const initialColumnVisibility = { value: false };
		const { result } = renderHook(() =>
			useDataTable({ data, columns, initialColumnVisibility }),
		);
		expect(result.current.columnVisibility).toEqual(
			initialColumnVisibility,
		);
	});

	it("uses initialRowSelection", () => {
		const initialRowSelection = { "1": true };
		const { result } = renderHook(() =>
			useDataTable({ data, columns, initialRowSelection }),
		);
		expect(result.current.rowSelection).toEqual(initialRowSelection);
	});

	it("calls onSortingChange when sorting updates", () => {
		const onSortingChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data, columns, onSortingChange }),
		);
		act(() => {
			result.current.table.setSorting([{ id: "name", desc: true }]);
		});
		expect(onSortingChange).toHaveBeenCalledWith([
			{ id: "name", desc: true },
		]);
	});

	it("calls onPaginationChange when pagination updates", () => {
		const onPaginationChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data, columns, onPaginationChange }),
		);
		act(() => {
			result.current.table.setPageIndex(1);
		});
		expect(onPaginationChange).toHaveBeenCalled();
		expect(onPaginationChange.mock.calls[0][0].pageIndex).toBe(1);
	});

	it("calls onRowSelectionChange when row selection updates", () => {
		const onRowSelectionChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				enableRowSelection: true,
				onRowSelectionChange,
			}),
		);
		act(() => {
			result.current.table.setRowSelection({ "0": true });
		});
		expect(onRowSelectionChange).toHaveBeenCalledWith({ "0": true });
	});

	it("calls onColumnFiltersChange when filters update", () => {
		const onColumnFiltersChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data, columns, onColumnFiltersChange }),
		);
		act(() => {
			result.current.table.setColumnFilters([
				{ id: "name", value: "Alpha" },
			]);
		});
		expect(onColumnFiltersChange).toHaveBeenCalledWith([
			{ id: "name", value: "Alpha" },
		]);
	});

	it("filters rows when column filter is set", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		act(() => {
			result.current.table.setColumnFilters([
				{ id: "name", value: "Beta" },
			]);
		});
		const rows = result.current.table.getFilteredRowModel().rows;
		expect(rows).toHaveLength(1);
		expect(rows[0].original.name).toBe("Beta");
	});

	it("uses custom getRowId", () => {
		const getRowId = (row: TestRow) => `custom-${row.id}`;
		const { result } = renderHook(() =>
			useDataTable({ data, columns, getRowId }),
		);
		const rows = result.current.table.getCoreRowModel().rows;
		expect(rows[0].id).toBe("custom-1");
	});
});
