import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolCompareLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ToolCompareLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ToolCompareLoading />);
		expect(container).toBeTruthy();
	});

	it("renders skeleton elements for both compare panels", () => {
		render(<ToolCompareLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(6);
	});

	it("renders a grid layout for the two comparison panels", () => {
		const { container } = render(<ToolCompareLoading />);
		const grids = container.querySelectorAll(".grid");
		expect(grids.length).toBeGreaterThanOrEqual(2);
	});
});
