import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

describe("Table", () => {
	describe("Table component", () => {
		it("renders with overflow wrapper", () => {
			render(
				<Table data-testid="table">
					<TableBody>
						<TableRow>
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			const table = screen.getByTestId("table");
			expect(table).toBeInTheDocument();
			expect(table.className).toContain("w-full");
			expect(table.className).toContain("caption-bottom");
			expect(table.className).toContain("text-sm");
		});
	});

	describe("TableHeader", () => {
		it("renders with border styling", () => {
			render(
				<Table>
					<TableHeader data-testid="header">
						<TableRow>
							<TableHead>Column</TableHead>
						</TableRow>
					</TableHeader>
				</Table>,
			);

			const header = screen.getByTestId("header");
			expect(header.className).toContain("[&_tr]:border-b");
		});
	});

	describe("TableBody", () => {
		it("removes border from last row", () => {
			render(
				<Table>
					<TableBody data-testid="body">
						<TableRow>
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			const body = screen.getByTestId("body");
			expect(body.className).toContain("[&_tr:last-child]:border-0");
		});
	});

	describe("TableFooter", () => {
		it("renders with brand-consistent muted styling", () => {
			render(
				<Table>
					<TableFooter data-testid="footer">
						<TableRow>
							<TableCell>Total</TableCell>
						</TableRow>
					</TableFooter>
				</Table>,
			);

			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("border-t");
			expect(footer.className).toContain("bg-muted/50");
			expect(footer.className).toContain("font-medium");
			expect(footer.className).toContain("text-foreground");
		});
	});

	describe("TableRow", () => {
		it("renders with hover and selection states", () => {
			render(
				<Table>
					<TableBody>
						<TableRow data-testid="row">
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			const row = screen.getByTestId("row");
			expect(row.className).toContain("border-b");
			expect(row.className).toContain("transition-colors");
			expect(row.className).toContain("hover:bg-muted/50");
			expect(row.className).toContain("data-[state=selected]:bg-muted");
		});
	});

	describe("TableHead", () => {
		it("renders with muted text color", () => {
			render(
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead data-testid="head">Column</TableHead>
						</TableRow>
					</TableHeader>
				</Table>,
			);

			const head = screen.getByTestId("head");
			expect(head.className).toContain("h-12");
			expect(head.className).toContain("px-4");
			expect(head.className).toContain("text-left");
			expect(head.className).toContain("align-middle");
			expect(head.className).toContain("font-medium");
			expect(head.className).toContain("text-foreground/60");
		});
	});

	describe("TableCell", () => {
		it("renders with proper padding", () => {
			render(
				<Table>
					<TableBody>
						<TableRow>
							<TableCell data-testid="cell">Content</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			const cell = screen.getByTestId("cell");
			expect(cell.className).toContain("p-4");
			expect(cell.className).toContain("align-middle");
		});
	});

	describe("TableCaption", () => {
		it("renders with muted foreground color", () => {
			render(
				<Table>
					<TableCaption data-testid="caption">
						Table caption
					</TableCaption>
					<TableBody>
						<TableRow>
							<TableCell>Cell</TableCell>
						</TableRow>
					</TableBody>
				</Table>,
			);

			const caption = screen.getByTestId("caption");
			expect(caption.className).toContain("mt-4");
			expect(caption.className).toContain("text-foreground/60");
			expect(caption.className).toContain("text-sm");
		});
	});

	describe("full table composition", () => {
		it("renders complete table structure correctly", () => {
			render(
				<Table>
					<TableCaption>A list of items</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Value</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell>Item 1</TableCell>
							<TableCell>$10.00</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Item 2</TableCell>
							<TableCell>$20.00</TableCell>
						</TableRow>
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell>Total</TableCell>
							<TableCell>$30.00</TableCell>
						</TableRow>
					</TableFooter>
				</Table>,
			);

			expect(screen.getByText("A list of items")).toBeInTheDocument();
			expect(screen.getByText("Name")).toBeInTheDocument();
			expect(screen.getByText("Value")).toBeInTheDocument();
			expect(screen.getByText("Item 1")).toBeInTheDocument();
			expect(screen.getByText("Item 2")).toBeInTheDocument();
			expect(screen.getByText("Total")).toBeInTheDocument();
			expect(screen.getByText("$30.00")).toBeInTheDocument();
		});
	});
});
