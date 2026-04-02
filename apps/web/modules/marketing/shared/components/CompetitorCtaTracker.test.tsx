import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { CompetitorCtaTracker } from "./CompetitorCtaTracker";

describe("CompetitorCtaTracker", () => {
	it("renders children", () => {
		render(
			<CompetitorCtaTracker
				competitorSlug="otter-ai"
				ctaType="signup"
				position="hero"
			>
				<button type="button">Sign up</button>
			</CompetitorCtaTracker>,
		);
		expect(
			screen.getByRole("button", { name: "Sign up" }),
		).toBeInTheDocument();
	});

	it("fires competitor_page_cta_clicked on click", () => {
		mockTrack.mockClear();
		render(
			<CompetitorCtaTracker
				competitorSlug="otter-ai"
				ctaType="signup"
				position="hero"
			>
				<button type="button">Sign up</button>
			</CompetitorCtaTracker>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "competitor_page_cta_clicked",
			props: {
				competitor_slug: "otter-ai",
				cta_type: "signup",
				position: "hero",
			},
		});
	});

	it("fires event with footer position variant", () => {
		mockTrack.mockClear();
		render(
			<CompetitorCtaTracker
				competitorSlug="chatgpt"
				ctaType="pricing"
				position="footer"
			>
				<button type="button">Pricing</button>
			</CompetitorCtaTracker>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Pricing" }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "competitor_page_cta_clicked",
			props: {
				competitor_slug: "chatgpt",
				cta_type: "pricing",
				position: "footer",
			},
		});
	});
});
