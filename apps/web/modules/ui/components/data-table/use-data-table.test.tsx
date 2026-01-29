import type { ColumnDef } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTable } from "./use-data-table";

interface TestData {
	id: string;
	name: string;
	email: string;
	age: number;
}

const testData: TestData[] = [
	{ id: "1", name: "Alice", email: "alice@example.com", age: 30 },
	{ id: "2", name: "Bob", email: "bob@example.com", age: 25 },
	{ id: "3", name: "Charlie", email: "charlie@example.com", age: 35 },
	{ id: "4", name: "Diana", email: "diana@example.com", age: 28 },
	{ id: "5", name: "Eve", email: "eve@example.com", age: 32 },
];

const columns: ColumnDef<TestData, unknown>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "age",
		header: "Age",
	},
];

describe("useDataTable", () => {
	describe("initialization", () => {
		it("initializes with default values", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
				}),
			);

			expect(result.current.sorting).toEqual([]);
			expect(result.current.columnFilters).toEqual([]);
			expect(result.current.columnVisibility).toEqual({});
			expect(result.current.rowSelection).toEqual({});
			expect(result.current.pagination).toEqual({
				pageIndex: 0,
				pageSize: 10,
			});
		});

		it("initializes with custom initial values", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					pageSize: 5,
					initialSorting: [{ id: "name", desc: false }],
					initialColumnVisibility: { email: false },
					initialRowSelection: { "0": true },
				}),
			);

			expect(result.current.sorting).toEqual([
				{ id: "name", desc: false },
			]);
			expect(result.current.columnVisibility).toEqual({ email: false });
			expect(result.current.rowSelection).toEqual({ "0": true });
			expect(result.current.pagination.pageSize).toBe(5);
		});
	});

	describe("sorting", () => {
		it("enables sorting by default", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
				}),
			);

			const nameColumn = result.current.table.getColumn("name");
			expect(nameColumn?.getCanSort()).toBe(true);
		});

		it("can disable sorting", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					enableSorting: false,
				}),
			);

			const nameColumn = result.current.table.getColumn("name");
			expect(nameColumn?.getCanSort()).toBe(false);
		});

		it("calls onSortingChange when sorting changes", () => {
			const onSortingChange = vi.fn();
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					onSortingChange,
				}),
			);

			act(() => {
				result.current.table.getColumn("name")?.toggleSorting(false);
			});

			expect(onSortingChange).toHaveBeenCalledWith([
				{ id: "name", desc: false },
			]);
		});
	});

	describe("pagination", () => {
		it("paginates data correctly", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					pageSize: 2,
				}),
			);

			expect(result.current.table.getRowModel().rows.length).toBe(2);
			expect(result.current.table.getPageCount()).toBe(3);
		});

		it("can navigate pages", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					pageSize: 2,
				}),
			);

			act(() => {
				result.current.table.nextPage();
			});

			expect(result.current.pagination.pageIndex).toBe(1);
		});

		it("calls onPaginationChange when pagination changes", () => {
			const onPaginationChange = vi.fn();
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					pageSize: 2,
					onPaginationChange,
				}),
			);

			act(() => {
				result.current.table.nextPage();
			});

			expect(onPaginationChange).toHaveBeenCalledWith({
				pageIndex: 1,
				pageSize: 2,
			});
		});
	});

	describe("row selection", () => {
		it("disables row selection by default", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
				}),
			);

			expect(result.current.table.options.enableRowSelection).toBe(false);
		});

		it("enables row selection when configured", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					enableRowSelection: true,
				}),
			);

			expect(result.current.table.options.enableRowSelection).toBe(true);
		});

		it("calls onRowSelectionChange when selection changes", () => {
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
				result.current.table.getRowModel().rows[0].toggleSelected(true);
			});

			expect(onRowSelectionChange).toHaveBeenCalled();
		});
	});

	describe("column visibility", () => {
		it("enables column visibility by default", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
				}),
			);

			const emailColumn = result.current.table.getColumn("email");
			expect(emailColumn?.getCanHide()).toBe(true);
		});

		it("can hide columns", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					initialColumnVisibility: { email: false },
				}),
			);

			const emailColumn = result.current.table.getColumn("email");
			expect(emailColumn?.getIsVisible()).toBe(false);
		});

		it("can toggle column visibility", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
				}),
			);

			act(() => {
				result.current.table
					.getColumn("email")
					?.toggleVisibility(false);
			});

			expect(result.current.columnVisibility).toEqual({ email: false });
		});
	});

	describe("manual mode", () => {
		it("supports manual pagination", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData.slice(0, 2),
					columns,
					manualPagination: true,
					pageCount: 3,
				}),
			);

			expect(result.current.table.getPageCount()).toBe(3);
		});

		it("supports manual sorting", () => {
			const onSortingChange = vi.fn();
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					manualSorting: true,
					onSortingChange,
				}),
			);

			act(() => {
				result.current.table.getColumn("name")?.toggleSorting(true);
			});

			// Data should not be auto-sorted; callback should be called
			expect(onSortingChange).toHaveBeenCalled();
		});
	});

	describe("custom row id", () => {
		it("uses custom getRowId function", () => {
			const { result } = renderHook(() =>
				useDataTable({
					data: testData,
					columns,
					getRowId: (row) => row.id,
				}),
			);

			const rows = result.current.table.getRowModel().rows;
			expect(rows[0].id).toBe("1");
			expect(rows[1].id).toBe("2");
		});
	});
});
