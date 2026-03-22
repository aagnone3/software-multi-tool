import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	DataTableSelectAll,
	DataTableSelectRow,
} from "./data-table-row-selection";

function makeTable(
	overrides: Partial<{
		getIsAllPageRowsSelected: () => boolean;
		getIsSomePageRowsSelected: () => boolean;
		toggleAllPageRowsSelected: (checked: boolean) => void;
	}> = {},
) {
	return {
		getIsAllPageRowsSelected: () => false,
		getIsSomePageRowsSelected: () => false,
		toggleAllPageRowsSelected: vi.fn(),
		...overrides,
	};
}

describe("DataTableSelectAll", () => {
	it("renders unchecked when nothing is selected", () => {
		const table = makeTable();
		render(<DataTableSelectAll table={table as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select all/i });
		expect((checkbox as HTMLInputElement).checked).toBe(false);
	});

	it("renders checked when all rows selected", () => {
		const table = makeTable({ getIsAllPageRowsSelected: () => true });
		render(<DataTableSelectAll table={table as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select all/i });
		expect((checkbox as HTMLInputElement).checked).toBe(true);
	});

	it("calls toggleAllPageRowsSelected on change", async () => {
		const user = userEvent.setup({ delay: null });
		const table = makeTable();
		render(<DataTableSelectAll table={table as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select all/i });
		await user.click(checkbox);
		expect(table.toggleAllPageRowsSelected).toHaveBeenCalled();
	});
});

describe("DataTableSelectRow", () => {
	it("renders unchecked when row is not selected", () => {
		const row = {
			getIsSelected: () => false,
			toggleSelected: vi.fn(),
		};
		render(<DataTableSelectRow row={row as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select row/i });
		expect((checkbox as HTMLInputElement).checked).toBe(false);
	});

	it("renders checked when row is selected", () => {
		const row = {
			getIsSelected: () => true,
			toggleSelected: vi.fn(),
		};
		render(<DataTableSelectRow row={row as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select row/i });
		expect((checkbox as HTMLInputElement).checked).toBe(true);
	});

	it("calls toggleSelected on change", async () => {
		const user = userEvent.setup({ delay: null });
		const row = {
			getIsSelected: () => false,
			toggleSelected: vi.fn(),
		};
		render(<DataTableSelectRow row={row as never} />);
		const checkbox = screen.getByRole("checkbox", { name: /select row/i });
		await user.click(checkbox);
		expect(row.toggleSelected).toHaveBeenCalled();
	});
});
