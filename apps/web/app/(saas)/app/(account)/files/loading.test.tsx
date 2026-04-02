import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import FilesLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("FilesLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<FilesLoading />);
		expect(container.firstChild).not.toBeNull();
	});

	it("renders multiple skeleton elements for table rows", () => {
		render(<FilesLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(10);
	});

	it("renders a container with content", () => {
		const { container } = render(<FilesLoading />);
		expect(container.firstChild).not.toBeNull();
		const root = container.firstChild as HTMLElement;
		expect(root.children.length).toBeGreaterThan(0);
	});
});
