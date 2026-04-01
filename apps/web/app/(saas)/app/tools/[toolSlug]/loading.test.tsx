import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolSlugLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ToolSlugLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ToolSlugLoading />);
		expect(container).toBeTruthy();
	});

	it("renders multiple skeleton elements", () => {
		render(<ToolSlugLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(8);
	});

	it("renders a two-column layout structure", () => {
		const { container } = render(<ToolSlugLoading />);
		// Should have a grid with lg:col-span-2 (main area) and sidebar
		const grid = container.querySelector(".grid");
		expect(grid).toBeTruthy();
	});
});
