import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import DashboardLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("DashboardLoading", () => {
	it("renders skeleton elements", () => {
		render(<DashboardLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders a grid of widget skeletons", () => {
		const { container } = render(<DashboardLoading />);
		// Should have multiple rounded-lg border containers
		const cards = container.querySelectorAll(".rounded-lg.border");
		expect(cards.length).toBeGreaterThan(3);
	});
});
