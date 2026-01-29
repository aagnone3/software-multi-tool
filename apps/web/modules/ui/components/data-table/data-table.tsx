"use client";

import type { Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib";
import type { ReactNode } from "react";
import * as React from "react";

export interface DataTableProps<TData> {
	table: TanStackTable<TData>;
	columns: number;
	isLoading?: boolean;
	loadingMessage?: ReactNode;
	emptyMessage?: ReactNode;
	onRowClick?: (row: TData) => void;
	rowClassName?: string | ((row: TData) => string);
	hideHeaders?: boolean;
}

export function DataTable<TData>({
	table,
	columns,
	isLoading = false,
	loadingMessage = "Loading...",
	emptyMessage = "No results.",
	onRowClick,
	rowClassName,
	hideHeaders = false,
}: DataTableProps<TData>) {
	const rows = table.getRowModel().rows;
	const hasRows = rows.length > 0;

	return (
		<div className="rounded-md border">
			<Table>
				{!hideHeaders && (
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
									>
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
				)}
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell
								colSpan={columns}
								className="h-24 text-center text-muted-foreground"
							>
								{loadingMessage}
							</TableCell>
						</TableRow>
					) : !hasRows ? (
						<TableRow>
							<TableCell
								colSpan={columns}
								className="h-24 text-center text-muted-foreground"
							>
								{emptyMessage}
							</TableCell>
						</TableRow>
					) : (
						rows.map((row) => {
							const rowData = row.original;
							const computedClassName =
								typeof rowClassName === "function"
									? rowClassName(rowData)
									: rowClassName;

							return (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
									className={cn(
										onRowClick &&
											"cursor-pointer transition-colors hover:bg-muted/50",
										computedClassName,
									)}
									onClick={
										onRowClick
											? () => onRowClick(rowData)
											: undefined
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
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
