import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import UsageHistoryLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("UsageHistoryLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<UsageHistoryLoading />);
		expect(container).toBeTruthy();
	});

	it("renders skeleton elements for summary cards, charts, and table", () => {
		render(<UsageHistoryLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(10);
	});
});
