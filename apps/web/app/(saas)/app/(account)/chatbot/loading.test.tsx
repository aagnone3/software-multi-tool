import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ChatbotLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("ChatbotLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ChatbotLoading />);
		expect(container.firstChild).not.toBeNull();
	});

	it("renders multiple skeleton elements", () => {
		render(<ChatbotLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(5);
	});

	it("renders sidebar and chat area layout", () => {
		const { container } = render(<ChatbotLoading />);
		const root = container.firstChild as HTMLElement;
		// Should have flex layout with both sidebar and chat area
		expect(root.className).toContain("flex");
	});
});
