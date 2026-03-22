import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTable } from "./use-data-table";

type TestRow = { id: string; name: string; value: number };

const columnHelper = createColumnHelper<TestRow>();
const columns = [
	columnHelper.accessor("id", { header: "ID" }),
	columnHelper.accessor("name", { header: "Name" }),
	columnHelper.accessor("value", { header: "Value" }),
] as ColumnDef<TestRow, unknown>[];

const testData: TestRow[] = [
	{ id: "1", name: "Alice", value: 10 },
	{ id: "2", name: "Bob", value: 20 },
	{ id: "3", name: "Charlie", value: 30 },
];

describe("useDataTable", () => {
	it("returns a table instance and initial state", () => {
		const { result } = renderHook(() =>
			useDataTable({ data: testData, columns }),
		);

		expect(result.current.table).toBeDefined();
		expect(result.current.sorting).toEqual([]);
		expect(result.current.columnFilters).toEqual([]);
		expect(result.current.columnVisibility).toEqual({});
		expect(result.current.rowSelection).toEqual({});
		expect(result.current.pagination.pageIndex).toBe(0);
		expect(result.current.pagination.pageSize).toBe(10);
	});

	it("uses custom pageSize", () => {
		const { result } = renderHook(() =>
			useDataTable({ data: testData, columns, pageSize: 5 }),
		);

		expect(result.current.pagination.pageSize).toBe(5);
	});

	it("uses initialSorting", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				initialSorting: [{ id: "name", desc: false }],
			}),
		);

		expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
	});

	it("uses initialColumnFilters", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				initialColumnFilters: [{ id: "name", value: "Alice" }],
			}),
		);

		expect(result.current.columnFilters).toEqual([
			{ id: "name", value: "Alice" },
		]);
	});

	it("uses initialColumnVisibility", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				initialColumnVisibility: { value: false },
			}),
		);

		expect(result.current.columnVisibility).toEqual({ value: false });
	});

	it("uses initialRowSelection", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				enableRowSelection: true,
				initialRowSelection: { "0": true },
			}),
		);

		expect(result.current.rowSelection).toEqual({ "0": true });
	});

	it("calls onSortingChange callback when sorting changes", () => {
		const onSortingChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data: testData, columns, onSortingChange }),
		);

		act(() => {
			result.current.table.setSorting([{ id: "name", desc: true }]);
		});

		expect(onSortingChange).toHaveBeenCalledWith([
			{ id: "name", desc: true },
		]);
		expect(result.current.sorting).toEqual([{ id: "name", desc: true }]);
	});

	it("calls onColumnFiltersChange callback when filters change", () => {
		const onColumnFiltersChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data: testData, columns, onColumnFiltersChange }),
		);

		act(() => {
			result.current.table.setColumnFilters([
				{ id: "name", value: "Bob" },
			]);
		});

		expect(onColumnFiltersChange).toHaveBeenCalledWith([
			{ id: "name", value: "Bob" },
		]);
	});

	it("calls onPaginationChange callback when pagination changes", () => {
		const onPaginationChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				pageSize: 1,
				onPaginationChange,
			}),
		);

		act(() => {
			result.current.table.nextPage();
		});

		expect(onPaginationChange).toHaveBeenCalled();
		expect(result.current.pagination.pageIndex).toBe(1);
	});

	it("calls onRowSelectionChange callback when row selection changes", () => {
		const onRowSelectionChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
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

	it("uses custom getRowId", () => {
		const getRowId = (row: TestRow) => row.id;
		const { result } = renderHook(() =>
			useDataTable({ data: testData, columns, getRowId }),
		);

		// Row IDs should be the "id" field values
		const rows = result.current.table.getRowModel().rows;
		expect(rows[0].id).toBe("1");
		expect(rows[1].id).toBe("2");
	});

	it("supports manualPagination with pageCount", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data: testData,
				columns,
				manualPagination: true,
				pageCount: 10,
			}),
		);

		expect(result.current.table.getPageCount()).toBe(10);
	});
});
