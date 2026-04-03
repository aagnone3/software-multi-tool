import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import NewOrganizationLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("NewOrganizationLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<NewOrganizationLoading />);
		expect(container).toBeTruthy();
	});

	it("renders skeleton elements for the form", () => {
		render(<NewOrganizationLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(3);
	});
});
