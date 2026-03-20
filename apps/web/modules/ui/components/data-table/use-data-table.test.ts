import type { ColumnDef } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTable } from "./use-data-table";

type Row = { id: string; name: string; value: number };

const columns: ColumnDef<Row, unknown>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "value", header: "Value" },
];

const data: Row[] = [
	{ id: "1", name: "Alpha", value: 10 },
	{ id: "2", name: "Beta", value: 20 },
	{ id: "3", name: "Gamma", value: 30 },
];

describe("useDataTable", () => {
	it("returns table and state with defaults", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		expect(result.current.table).toBeDefined();
		expect(result.current.sorting).toEqual([]);
		expect(result.current.columnFilters).toEqual([]);
		expect(result.current.rowSelection).toEqual({});
		expect(result.current.pagination).toEqual({
			pageIndex: 0,
			pageSize: 10,
		});
	});

	it("uses custom pageSize", () => {
		const { result } = renderHook(() =>
			useDataTable({ data, columns, pageSize: 5 }),
		);
		expect(result.current.pagination.pageSize).toBe(5);
	});

	it("uses initialSorting", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				initialSorting: [{ id: "name", desc: false }],
			}),
		);
		expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
	});

	it("uses initialColumnVisibility", () => {
		const { result } = renderHook(() =>
			useDataTable({
				data,
				columns,
				initialColumnVisibility: { value: false },
			}),
		);
		expect(result.current.columnVisibility).toEqual({ value: false });
	});

	it("returns rows from data", () => {
		const { result } = renderHook(() => useDataTable({ data, columns }));
		expect(result.current.table.getRowModel().rows).toHaveLength(3);
	});

	it("calls onSortingChange callback", () => {
		const onSortingChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTable({ data, columns, onSortingChange }),
		);
		result.current.table.getColumn("name")?.toggleSorting();
		expect(onSortingChange).toHaveBeenCalledWith([
			{ id: "name", desc: false },
		]);
	});

	it("uses getRowId when provided", () => {
		const { result } = renderHook(() =>
			useDataTable({ data, columns, getRowId: (row) => row.id }),
		);
		const rows = result.current.table.getRowModel().rows;
		expect(rows[0].id).toBe("1");
	});
});
