import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { PricingPageTracker } from "./PricingPageTracker";

describe("PricingPageTracker", () => {
	it("fires pricing_page_viewed on mount", () => {
		render(<PricingPageTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "pricing_page_viewed",
			props: {},
		});
	});

	it("renders nothing", () => {
		const { container } = render(<PricingPageTracker />);
		expect(container.firstChild).toBeNull();
	});
});
