import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DataTablePagination } from "./data-table-pagination";

function makeTable(overrides = {}) {
	return {
		getState: () => ({
			pagination: { pageIndex: 0, pageSize: 10 },
		}),
		getPageCount: () => 3,
		getFilteredRowModel: () => ({ rows: Array(25).fill({}) }),
		getFilteredSelectedRowModel: () => ({ rows: [] }),
		getCanPreviousPage: () => false,
		getCanNextPage: () => true,
		setPageIndex: vi.fn(),
		setPageSize: vi.fn(),
		previousPage: vi.fn(),
		nextPage: vi.fn(),
		...overrides,
	} as any;
}

describe("DataTablePagination", () => {
	it("shows row range", () => {
		render(<DataTablePagination table={makeTable()} />);
		expect(
			screen.getByText("Showing 1 to 10 of 25 row(s)"),
		).toBeInTheDocument();
	});

	it("shows 'No rows' when no rows", () => {
		const table = makeTable({
			getFilteredRowModel: () => ({ rows: [] }),
		});
		render(<DataTablePagination table={table} />);
		expect(screen.getByText("No rows")).toBeInTheDocument();
	});

	it("shows selected count when showSelectedCount=true and rows selected", () => {
		const table = makeTable({
			getFilteredSelectedRowModel: () => ({ rows: Array(5).fill({}) }),
		});
		render(<DataTablePagination table={table} showSelectedCount={true} />);
		expect(screen.getByText("5 of 25 row(s) selected")).toBeInTheDocument();
	});

	it("shows page number", () => {
		render(<DataTablePagination table={makeTable()} />);
		expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
	});

	it("next page button calls nextPage", async () => {
		const user = userEvent.setup({ delay: null });
		const table = makeTable({
			getCanPreviousPage: () => true,
			getCanNextPage: () => true,
		});
		render(<DataTablePagination table={table} />);
		const buttons = screen.getAllByRole("button");
		// next page is third button (first=first, second=prev, third=next, fourth=last)
		await user.click(buttons[2]);
		expect(table.nextPage).toHaveBeenCalled();
	});

	it("previous page button calls previousPage", async () => {
		const user = userEvent.setup({ delay: null });
		const table = makeTable({
			getCanPreviousPage: () => true,
			getCanNextPage: () => true,
		});
		render(<DataTablePagination table={table} />);
		const buttons = screen.getAllByRole("button");
		await user.click(buttons[1]);
		expect(table.previousPage).toHaveBeenCalled();
	});

	it("first page button calls setPageIndex(0)", async () => {
		const user = userEvent.setup({ delay: null });
		const table = makeTable({
			getCanPreviousPage: () => true,
			getCanNextPage: () => true,
		});
		render(<DataTablePagination table={table} />);
		const buttons = screen.getAllByRole("button");
		await user.click(buttons[0]);
		expect(table.setPageIndex).toHaveBeenCalledWith(0);
	});
});
