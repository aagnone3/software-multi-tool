import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import SettingsLoading from "./loading";

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

describe("SettingsLoading", () => {
	it("renders without crashing", () => {
		render(<SettingsLoading />);
	});

	it("renders multiple skeleton elements", () => {
		render(<SettingsLoading />);
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(5);
	});
});
