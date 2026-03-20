import type { UseQueryResult } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTableQuery } from "./use-data-table-query";

type Row = { id: string; name: string };

const columns: ColumnDef<Row, unknown>[] = [
	{ accessorKey: "id", header: "ID" },
	{ accessorKey: "name", header: "Name" },
];

type QueryData = { items: Row[]; total: number };

const makeQueryResult = (
	overrides: Partial<{
		data: QueryData;
		isLoading: boolean;
		isError: boolean;
		error: unknown;
	}> = {},
) =>
	({
		data: { items: [], total: 0 },
		isLoading: false,
		isError: false,
		error: null,
		...overrides,
	}) as UseQueryResult<QueryData, unknown>;

describe("useDataTableQuery", () => {
	const getRows = (data: QueryData | undefined) => data?.items ?? [];
	const getTotalCount = (data: QueryData | undefined) => data?.total ?? 0;

	it("returns expected initial state with empty data", () => {
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult(),
				getRows,
				getTotalCount,
			}),
		);
		expect(result.current.sorting).toEqual([]);
		expect(result.current.pagination).toEqual({
			pageIndex: 0,
			pageSize: 10,
		});
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(result.current.totalCount).toBe(0);
		expect(result.current.pageCount).toBe(0);
	});

	it("reflects isLoading from queryResult", () => {
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult({
					data: undefined,
					isLoading: true,
				}),
				getRows,
				getTotalCount,
			}),
		);
		expect(result.current.isLoading).toBe(true);
	});

	it("reflects isError and error from queryResult", () => {
		const err = new Error("oops");
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult({
					data: undefined,
					isError: true,
					error: err,
				}),
				getRows,
				getTotalCount,
			}),
		);
		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBe(err);
	});

	it("computes totalCount and pageCount from data", () => {
		const items: Row[] = [
			{ id: "1", name: "A" },
			{ id: "2", name: "B" },
		];
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult({ data: { items, total: 25 } }),
				getRows,
				getTotalCount,
				pageSize: 10,
			}),
		);
		expect(result.current.totalCount).toBe(25);
		expect(result.current.pageCount).toBe(3);
		expect(result.current.table.getRowModel().rows).toHaveLength(2);
	});

	it("uses custom pageSize", () => {
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult(),
				getRows,
				getTotalCount,
				pageSize: 5,
			}),
		);
		expect(result.current.pagination.pageSize).toBe(5);
	});

	it("uses initialColumnVisibility", () => {
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult(),
				getRows,
				getTotalCount,
				initialColumnVisibility: { name: false },
			}),
		);
		expect(result.current.columnVisibility).toEqual({ name: false });
	});

	it("calls onSortingChange callback", () => {
		const onSortingChange = vi.fn();
		const { result } = renderHook(() =>
			useDataTableQuery({
				columns,
				queryResult: makeQueryResult(),
				getRows,
				getTotalCount,
				onSortingChange,
			}),
		);
		result.current.table.getColumn("name")?.toggleSorting();
		expect(onSortingChange).toHaveBeenCalledWith([
			{ id: "name", desc: true },
		]);
	});
});
