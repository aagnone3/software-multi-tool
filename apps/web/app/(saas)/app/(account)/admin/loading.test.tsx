import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import AdminLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("AdminLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<AdminLoading />);
		expect(container.firstChild).not.toBeNull();
	});

	it("renders multiple skeleton elements", () => {
		render(<AdminLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(5);
	});

	it("renders a container with content", () => {
		const { container } = render(<AdminLoading />);
		// Should have a root div with children
		expect(container.firstChild).not.toBeNull();
		const root = container.firstChild as HTMLElement;
		expect(root.children.length).toBeGreaterThan(0);
	});
});
