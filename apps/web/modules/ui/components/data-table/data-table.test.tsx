import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";

interface TestData {
	id: string;
	name: string;
	email: string;
}

const testData: TestData[] = [
	{ id: "1", name: "John Doe", email: "john@example.com" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com" },
	{ id: "3", name: "Bob Wilson", email: "bob@example.com" },
];

const columns: ColumnDef<TestData>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
];

function TestDataTable({
	data = testData,
	isLoading = false,
	emptyMessage,
	loadingMessage,
	onRowClick,
}: {
	data?: TestData[];
	isLoading?: boolean;
	emptyMessage?: React.ReactNode;
	loadingMessage?: React.ReactNode;
	onRowClick?: (row: TestData) => void;
}) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<DataTable
			table={table}
			columns={columns.length}
			isLoading={isLoading}
			emptyMessage={emptyMessage}
			loadingMessage={loadingMessage}
			onRowClick={onRowClick}
		/>
	);
}

describe("DataTable", () => {
	describe("rendering", () => {
		it("renders table with headers", () => {
			render(<TestDataTable />);

			expect(screen.getByText("Name")).toBeInTheDocument();
			expect(screen.getByText("Email")).toBeInTheDocument();
		});

		it("renders table rows with data", () => {
			render(<TestDataTable />);

			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("john@example.com")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("jane@example.com")).toBeInTheDocument();
			expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
			expect(screen.getByText("bob@example.com")).toBeInTheDocument();
		});
	});

	describe("loading state", () => {
		it("shows default loading message when loading", () => {
			render(<TestDataTable isLoading={true} />);

			expect(screen.getByText("Loading...")).toBeInTheDocument();
		});

		it("shows custom loading message when provided", () => {
			render(
				<TestDataTable
					isLoading={true}
					loadingMessage="Fetching data..."
				/>,
			);

			expect(screen.getByText("Fetching data...")).toBeInTheDocument();
		});

		it("does not show data rows when loading", () => {
			render(<TestDataTable isLoading={true} />);

			expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
		});
	});

	describe("empty state", () => {
		it("shows default empty message when no data", () => {
			render(<TestDataTable data={[]} />);

			expect(screen.getByText("No results.")).toBeInTheDocument();
		});

		it("shows custom empty message when provided", () => {
			render(<TestDataTable data={[]} emptyMessage="No users found" />);

			expect(screen.getByText("No users found")).toBeInTheDocument();
		});
	});

	describe("row click handling", () => {
		it("calls onRowClick when row is clicked", () => {
			const handleRowClick = vi.fn();
			render(<TestDataTable onRowClick={handleRowClick} />);

			const row = screen.getByText("John Doe").closest("tr");
			expect(row).not.toBeNull();
			if (row) {
				fireEvent.click(row);
			}

			expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
		});

		it("adds cursor-pointer class when onRowClick is provided", () => {
			const handleRowClick = vi.fn();
			render(<TestDataTable onRowClick={handleRowClick} />);

			const row = screen.getByText("John Doe").closest("tr");
			expect(row?.className).toContain("cursor-pointer");
		});

		it("does not add cursor-pointer class when onRowClick is not provided", () => {
			render(<TestDataTable />);

			const row = screen.getByText("John Doe").closest("tr");
			expect(row?.className).not.toContain("cursor-pointer");
		});
	});
});
