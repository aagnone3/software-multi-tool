import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolCompareErrorBoundary from "./error";

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

describe("ToolCompareErrorBoundary", () => {
	const mockError = new Error("Test error") as Error & { digest?: string };
	const mockReset = vi.fn();

	it("renders error heading", () => {
		render(
			<ToolCompareErrorBoundary error={mockError} reset={mockReset} />,
		);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("calls reset when Try again is clicked", () => {
		render(
			<ToolCompareErrorBoundary error={mockError} reset={mockReset} />,
		);
		fireEvent.click(screen.getByText("Try again"));
		expect(mockReset).toHaveBeenCalled();
	});

	it("renders back to tools link", () => {
		render(
			<ToolCompareErrorBoundary error={mockError} reset={mockReset} />,
		);
		expect(screen.getByText("Back to tools")).toBeInTheDocument();
	});
});
