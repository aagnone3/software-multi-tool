import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTable } from "./use-data-table";

interface TestRow {
	id: string;
	name: string;
	value: number;
}

const columnHelper = createColumnHelper<TestRow>();

const columns: ColumnDef<TestRow, unknown>[] = [
	columnHelper.accessor("id", { header: "ID" }) as ColumnDef<
		TestRow,
		unknown
	>,
	columnHelper.accessor("name", { header: "Name" }) as ColumnDef<
		TestRow,
		unknown
	>,
	columnHelper.accessor("value", { header: "Value" }) as ColumnDef<
		TestRow,
		unknown
	>,
];

const data: TestRow[] = [
	{ id: "1", name: "Alpha", value: 10 },
	{ id: "2", name: "Beta", value: 20 },
	{ id: "3", name: "Gamma", value: 30 },
];

describe("useDataTable", () => {
	it("returns table and initial state", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		expect(result.current.table).toBeDefined();
		expect(result.current.sorting).toEqual([]);
		expect(result.current.columnFilters).toEqual([]);
		expect(result.current.rowSelection).toEqual({});
		expect(result.current.pagination.pageSize).toBe(10);
		expect(result.current.pagination.pageIndex).toBe(0);
	});

	it("respects custom pageSize", () => {
		const { result } = renderHook(() =>
			useDataTable({ data, columns, pageSize: 5 }),
		);
		expect(result.current.pagination.pageSize).toBe(5);
	});

	it("respects initialSorting", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				initialSorting: [{ id: "name", desc: false }],
			}),
		);
		expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
	});

	it("respects initialColumnFilters", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				initialColumnFilters: [{ id: "name", value: "Alpha" }],
			}),
		);
		expect(result.current.columnFilters).toEqual([
			{ id: "name", value: "Alpha" },
		]);
	});

	it("respects initialRowSelection", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				enableRowSelection: true,
				initialRowSelection: { "1": true },
			}),
		);
		expect(result.current.rowSelection).toEqual({ "1": true });
	});

	it("calls onSortingChange when sorting changes", () => {
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
		expect(result.current.sorting).toEqual([{ id: "name", desc: true }]);
	});

	it("calls onPaginationChange when pagination changes", () => {
		const onPaginationChange = vi.fn();
		const largeData: TestRow[] = Array.from({ length: 20 }, (_, i) => ({
			id: String(i),
			name: `Name${i}`,
			value: i,
		}));
		const { result } = renderHook(() =>
			useDataTable({
				data: largeData,
				columns,
				pageSize: 5,
				onPaginationChange,
			}),
		);
		act(() => {
			result.current.table.setPageIndex(1);
		});
		expect(onPaginationChange).toHaveBeenCalledWith(
			expect.objectContaining({ pageIndex: 1, pageSize: 5 }),
		);
	});

	it("calls onColumnFiltersChange when filters change", () => {
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

	it("calls onRowSelectionChange when row selection changes", () => {
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

	it("uses getRowId when provided", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				getRowId: (row) => row.id,
			}),
		);
		const rows = result.current.table.getRowModel().rows;
		expect(rows[0].id).toBe("1");
		expect(rows[1].id).toBe("2");
	});

	it("supports manualPagination with pageCount", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				manualPagination: true,
				pageCount: 10,
			}),
		);
		expect(result.current.table.getPageCount()).toBe(10);
	});
});
