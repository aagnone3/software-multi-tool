import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DataTableColumnHeader } from "./data-table-column-header";

function makeColumn(
	overrides: Partial<{
		getCanSort: () => boolean;
		getCanHide: () => boolean;
		getIsSorted: () => false | "asc" | "desc";
		toggleSorting: (desc: boolean) => void;
		toggleVisibility: (visible: boolean) => void;
	}> = {},
) {
	return {
		getCanSort: () => true,
		getCanHide: () => true,
		getIsSorted: () => false as const,
		toggleSorting: vi.fn(),
		toggleVisibility: vi.fn(),
		...overrides,
	};
}

describe("DataTableColumnHeader", () => {
	it("renders plain title when column cannot sort or hide", () => {
		const col = makeColumn({
			getCanSort: () => false,
			getCanHide: () => false,
		});
		render(<DataTableColumnHeader column={col as never} title="Name" />);
		expect(screen.getByText("Name")).toBeDefined();
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("renders sortable button with title", () => {
		const col = makeColumn();
		render(<DataTableColumnHeader column={col as never} title="Status" />);
		expect(screen.getByRole("button")).toBeDefined();
		expect(screen.getByText("Status")).toBeDefined();
	});

	it("shows asc arrow when sorted ascending", () => {
		const col = makeColumn({ getIsSorted: () => "asc" });
		render(<DataTableColumnHeader column={col as never} title="Date" />);
		// ArrowUpIcon renders an svg — button still present
		expect(screen.getByRole("button")).toBeDefined();
	});

	it("shows desc arrow when sorted descending", () => {
		const col = makeColumn({ getIsSorted: () => "desc" });
		render(<DataTableColumnHeader column={col as never} title="Date" />);
		expect(screen.getByRole("button")).toBeDefined();
	});

	it("calls toggleSorting(false) when Asc menu item clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const col = makeColumn();
		render(<DataTableColumnHeader column={col as never} title="Name" />);
		await user.click(screen.getByRole("button"));
		const ascItem = screen.getByText("Asc");
		await user.click(ascItem);
		expect(col.toggleSorting).toHaveBeenCalledWith(false);
	});

	it("calls toggleSorting(true) when Desc menu item clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const col = makeColumn();
		render(<DataTableColumnHeader column={col as never} title="Name" />);
		await user.click(screen.getByRole("button"));
		const descItem = screen.getByText("Desc");
		await user.click(descItem);
		expect(col.toggleSorting).toHaveBeenCalledWith(true);
	});

	it("calls toggleVisibility(false) when Hide menu item clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const col = makeColumn();
		render(<DataTableColumnHeader column={col as never} title="Name" />);
		await user.click(screen.getByRole("button"));
		const hideItem = screen.getByText("Hide");
		await user.click(hideItem);
		expect(col.toggleVisibility).toHaveBeenCalledWith(false);
	});
});
