import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { CompetitorPageTracker } from "./CompetitorPageTracker";

describe("CompetitorPageTracker", () => {
	it("renders nothing visible", () => {
		const { container } = render(
			<CompetitorPageTracker
				competitorSlug="chatgpt"
				competitorName="ChatGPT"
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("fires competitor_page_viewed event on mount", () => {
		mockTrack.mockClear();
		render(
			<CompetitorPageTracker
				competitorSlug="chatgpt"
				competitorName="ChatGPT"
			/>,
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "competitor_page_viewed",
			props: {
				competitor_slug: "chatgpt",
				competitor_name: "ChatGPT",
			},
		});
	});
});
