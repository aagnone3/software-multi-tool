import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolsLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ToolsLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ToolsLoading />);
		expect(container).toBeTruthy();
	});

	it("renders multiple skeleton elements", () => {
		render(<ToolsLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(5);
	});

	it("renders a grid of tool card skeletons", () => {
		const { container } = render(<ToolsLoading />);
		const grid = container.querySelector(".grid");
		expect(grid).toBeTruthy();
	});
});
