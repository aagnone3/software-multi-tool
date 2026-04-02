import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));
vi.mock("next/navigation", () => ({
	usePathname: () => "/blog/how-to-automate-expense-categorization-with-ai",
}));

import { MidPostCTA } from "./MidPostCTA";

describe("MidPostCTA", () => {
	beforeEach(() => {
		mockTrack.mockClear();
	});

	it("renders get started CTA", () => {
		render(<MidPostCTA />);
		expect(screen.getByText(/Get started free/i)).toBeInTheDocument();
	});

	it("tracks mid post cta click with post slug", () => {
		render(<MidPostCTA />);
		fireEvent.click(screen.getByText(/Get started free/i));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_mid_post_cta_clicked",
			props: {
				post_slug: "how-to-automate-expense-categorization-with-ai",
			},
		});
	});
});
