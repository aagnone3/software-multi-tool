import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricingFaq } from "./PricingFaq";

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("PricingFaq", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it("renders the section heading", () => {
		render(<PricingFaq />);
		expect(
			screen.getByText("Pricing questions answered"),
		).toBeInTheDocument();
	});

	it("renders all 6 FAQ questions", () => {
		render(<PricingFaq />);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(6);
	});

	it("answers are collapsed by default", () => {
		render(<PricingFaq />);
		expect(
			screen.queryByText(/Your tools simply pause/),
		).not.toBeInTheDocument();
	});

	it("expands an answer on click", () => {
		render(<PricingFaq />);
		const firstButton = screen.getAllByRole("button")[0];
		fireEvent.click(firstButton);
		expect(screen.getByText(/Your tools simply pause/)).toBeInTheDocument();
	});

	it("collapses the answer on second click", () => {
		render(<PricingFaq />);
		const firstButton = screen.getAllByRole("button")[0];
		fireEvent.click(firstButton);
		fireEvent.click(firstButton);
		expect(
			screen.queryByText(/Your tools simply pause/),
		).not.toBeInTheDocument();
	});

	it("tracks pricing_faq_expanded on first click", () => {
		render(<PricingFaq />);
		const firstButton = screen.getAllByRole("button")[0];
		fireEvent.click(firstButton);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "pricing_faq_expanded",
			props: { question: "What happens when I run out of credits?" },
		});
	});

	it("does not track on collapse (second click)", () => {
		render(<PricingFaq />);
		const firstButton = screen.getAllByRole("button")[0];
		fireEvent.click(firstButton);
		mockTrack.mockClear();
		fireEvent.click(firstButton);
		expect(mockTrack).not.toHaveBeenCalled();
	});

	it("sets aria-expanded correctly", () => {
		render(<PricingFaq />);
		const firstButton = screen.getAllByRole("button")[0];
		expect(firstButton).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(firstButton);
		expect(firstButton).toHaveAttribute("aria-expanded", "true");
	});
});
