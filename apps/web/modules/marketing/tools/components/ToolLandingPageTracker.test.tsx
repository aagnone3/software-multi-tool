import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { ToolLandingPageTracker } from "./ToolLandingPageTracker";

describe("ToolLandingPageTracker", () => {
	it("fires tool_marketing_page_viewed on mount", () => {
		render(
			<ToolLandingPageTracker
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_marketing_page_viewed",
			props: { tool_slug: "news-analyzer", tool_name: "News Analyzer" },
		});
	});

	it("renders nothing visible", () => {
		const { container } = render(
			<ToolLandingPageTracker toolSlug="foo" toolName="Foo" />,
		);
		expect(container.firstChild).toBeNull();
	});
});
