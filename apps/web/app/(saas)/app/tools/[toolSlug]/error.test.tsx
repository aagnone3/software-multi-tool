import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolPageErrorBoundary from "./error";

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		asChild,
		variant,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		asChild?: boolean;
		variant?: string;
	}) => {
		if (asChild) {
			return <>{children}</>;
		}
		return (
			<button onClick={onClick} data-variant={variant} {...props}>
				{children}
			</button>
		);
	},
}));

describe("ToolPageErrorBoundary", () => {
	const mockError = new Error("Test tool error") as Error & {
		digest?: string;
	};
	const mockReset = vi.fn();

	it("renders error heading", () => {
		render(<ToolPageErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("renders error description mentioning previous runs are safe", () => {
		render(<ToolPageErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText(/previous runs are safe/i)).toBeInTheDocument();
	});

	it("renders Try again button", () => {
		render(<ToolPageErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Try again")).toBeInTheDocument();
	});

	it("calls reset when Try again is clicked", () => {
		render(<ToolPageErrorBoundary error={mockError} reset={mockReset} />);
		fireEvent.click(screen.getByText("Try again"));
		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("renders Back to tools link with correct href", () => {
		render(<ToolPageErrorBoundary error={mockError} reset={mockReset} />);
		const link = screen.getByRole("link", { name: /back to tools/i });
		expect(link).toHaveAttribute("href", "/app/tools");
	});
});
