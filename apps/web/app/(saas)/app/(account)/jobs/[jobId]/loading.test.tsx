import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import JobDetailLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("JobDetailLoading", () => {
	it("renders skeleton elements", () => {
		render(<JobDetailLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders main content and sidebar layout", () => {
		const { container } = render(<JobDetailLoading />);
		const cards = container.querySelectorAll(".rounded-lg.border");
		expect(cards.length).toBeGreaterThanOrEqual(3);
	});
});
