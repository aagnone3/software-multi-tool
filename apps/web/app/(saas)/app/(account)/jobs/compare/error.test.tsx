import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import JobCompareErrorBoundary from "./error";

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

describe("JobCompareErrorBoundary", () => {
	const mockError = new Error("Test error") as Error & { digest?: string };
	const mockReset = vi.fn();

	it("renders error heading", () => {
		render(<JobCompareErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("calls reset when Try again is clicked", () => {
		render(<JobCompareErrorBoundary error={mockError} reset={mockReset} />);
		fireEvent.click(screen.getByText("Try again"));
		expect(mockReset).toHaveBeenCalled();
	});

	it("renders back to jobs link", () => {
		render(<JobCompareErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Back to jobs")).toBeInTheDocument();
	});
});
