import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

vi.mock("lucide-react", () => ({
	ChevronLeftIcon: () => <span data-testid="chevron-left" />,
	ChevronRightIcon: () => <span data-testid="chevron-right" />,
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		disabled,
		onClick,
	}: {
		children: React.ReactNode;
		disabled?: boolean;
		onClick?: () => void;
	}) => (
		<button type="button" disabled={disabled} onClick={onClick}>
			{children}
		</button>
	),
}));

describe("Pagination", () => {
	const defaultProps = {
		totalItems: 50,
		itemsPerPage: 10,
		currentPage: 1,
		onChangeCurrentPage: vi.fn(),
	};

	it("renders page range and total correctly", () => {
		render(<Pagination {...defaultProps} />);
		expect(screen.getByText(/1 - 10 of 50/)).toBeTruthy();
	});

	it("disables previous button on first page", () => {
		render(<Pagination {...defaultProps} currentPage={1} />);
		const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
		expect(buttons[0].disabled).toBe(true);
	});

	it("disables next button on last page", () => {
		render(<Pagination {...defaultProps} currentPage={5} />);
		const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
		expect(buttons[1].disabled).toBe(true);
	});

	it("enables both buttons in the middle", () => {
		render(<Pagination {...defaultProps} currentPage={3} />);
		const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
		expect(buttons[0].disabled).toBe(false);
		expect(buttons[1].disabled).toBe(false);
	});

	it("calls onChangeCurrentPage with previous page on prev click", async () => {
		const onChangeCurrentPage = vi.fn();
		render(
			<Pagination
				{...defaultProps}
				currentPage={3}
				onChangeCurrentPage={onChangeCurrentPage}
			/>,
		);
		const buttons = screen.getAllByRole("button");
		await userEvent.click(buttons[0]);
		expect(onChangeCurrentPage).toHaveBeenCalledWith(2);
	});

	it("calls onChangeCurrentPage with next page on next click", async () => {
		const onChangeCurrentPage = vi.fn();
		render(
			<Pagination
				{...defaultProps}
				currentPage={2}
				onChangeCurrentPage={onChangeCurrentPage}
			/>,
		);
		const buttons = screen.getAllByRole("button");
		await userEvent.click(buttons[1]);
		expect(onChangeCurrentPage).toHaveBeenCalledWith(3);
	});

	it("shows total items as upper bound when on last page", () => {
		render(
			<Pagination
				{...defaultProps}
				currentPage={5}
				totalItems={47}
				itemsPerPage={10}
			/>,
		);
		expect(screen.getByText(/41 - 47 of 47/)).toBeTruthy();
	});

	it("applies className prop", () => {
		const { container } = render(
			<Pagination {...defaultProps} className="test-class" />,
		);
		expect(container.firstChild).toHaveProperty("className", "test-class");
	});
});
