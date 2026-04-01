import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolsErrorBoundary from "./error";

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

describe("ToolsErrorBoundary", () => {
	const mockError = new Error("Test error") as Error & { digest?: string };
	const mockReset = vi.fn();

	it("renders error heading", () => {
		render(<ToolsErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("renders error description", () => {
		render(<ToolsErrorBoundary error={mockError} reset={mockReset} />);
		expect(
			screen.getByText(/unexpected error loading this tool/i),
		).toBeInTheDocument();
	});

	it("renders Try again button", () => {
		render(<ToolsErrorBoundary error={mockError} reset={mockReset} />);
		expect(screen.getByText("Try again")).toBeInTheDocument();
	});

	it("calls reset when Try again is clicked", () => {
		render(<ToolsErrorBoundary error={mockError} reset={mockReset} />);
		fireEvent.click(screen.getByText("Try again"));
		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("renders Back to tools link", () => {
		render(<ToolsErrorBoundary error={mockError} reset={mockReset} />);
		const link = screen.getByRole("link", { name: /back to tools/i });
		expect(link).toHaveAttribute("href", "/app/tools");
	});
});
