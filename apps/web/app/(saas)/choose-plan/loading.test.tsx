import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ChoosePlanLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ChoosePlanLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ChoosePlanLoading />);
		expect(container).toBeTruthy();
	});

	it("renders multiple skeleton elements for plan cards", () => {
		render(<ChoosePlanLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(10);
	});

	it("renders a grid for plan cards", () => {
		const { container } = render(<ChoosePlanLoading />);
		const grid = container.querySelector(".grid");
		expect(grid).toBeTruthy();
	});
});
