import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolInsightsLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ToolInsightsLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ToolInsightsLoading />);
		expect(container).toBeTruthy();
	});

	it("renders skeleton elements for stats, charts, and table", () => {
		render(<ToolInsightsLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(10);
	});
});
