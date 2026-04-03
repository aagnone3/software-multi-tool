import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import OnboardingLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("OnboardingLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<OnboardingLoading />);
		expect(container).toBeTruthy();
	});

	it("renders skeleton elements for progress steps and form", () => {
		render(<OnboardingLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(8);
	});
});
