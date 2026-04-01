import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import JobsLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("JobsLoading", () => {
	it("renders without crashing", () => {
		render(<JobsLoading />);
	});

	it("renders multiple skeleton elements", () => {
		render(<JobsLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(5);
	});
});
