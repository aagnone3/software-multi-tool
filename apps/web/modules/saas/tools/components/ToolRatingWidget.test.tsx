import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the hook
const mockGetRating = vi.fn();
const mockRateTool = vi.fn();

vi.mock("../hooks/use-tool-ratings", () => ({
	useToolRatings: () => ({
		getRating: mockGetRating,
		rateTool: mockRateTool,
		ratings: {},
	}),
}));

import { ToolRatingWidget } from "./ToolRatingWidget";

describe("ToolRatingWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetRating.mockReturnValue(null);
	});

	it("renders 5 star buttons", () => {
		render(<ToolRatingWidget toolSlug="test-tool" />);
		for (let i = 1; i <= 5; i++) {
			expect(
				screen.getByRole("button", {
					name: new RegExp(`Rate ${i} star`),
				}),
			).toBeDefined();
		}
	});

	it("shows 'Rate this tool' label when unrated", () => {
		render(<ToolRatingWidget toolSlug="test-tool" />);
		expect(screen.getByText("Rate this tool")).toBeDefined();
	});

	it("shows 'Your rating' label when rated", () => {
		mockGetRating.mockReturnValue(3);
		render(<ToolRatingWidget toolSlug="test-tool" />);
		expect(screen.getByText("Your rating")).toBeDefined();
	});

	it("calls rateTool when a star is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolRatingWidget toolSlug="my-tool" />);
		await user.click(screen.getByRole("button", { name: /Rate 4 star/ }));
		expect(mockRateTool).toHaveBeenCalledWith("my-tool", 4);
	});

	it("hides label when showLabel=false", () => {
		render(<ToolRatingWidget toolSlug="test-tool" showLabel={false} />);
		expect(screen.queryByText("Rate this tool")).toBeNull();
	});

	it("shows rating summary when rated", () => {
		mockGetRating.mockReturnValue(4);
		render(<ToolRatingWidget toolSlug="test-tool" />);
		expect(screen.getByText("You rated this 4/5")).toBeDefined();
	});
});
