import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolViewTracker } from "./ToolViewTracker";

const mockRecordView = vi.fn();
const mockTrack = vi.fn();

vi.mock("@saas/tools/hooks/use-recently-viewed-tools", () => ({
	useRecentlyViewedTools: () => ({
		recentTools: [],
		recordView: mockRecordView,
	}),
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("ToolViewTracker", () => {
	it("renders nothing (returns null)", () => {
		const { container } = render(
			<ToolViewTracker
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("calls recordView with toolSlug on mount", () => {
		render(
			<ToolViewTracker
				toolSlug="contract-analyzer"
				toolName="Contract Analyzer"
			/>,
		);
		expect(mockRecordView).toHaveBeenCalledWith("contract-analyzer");
	});

	it("fires tool_page_viewed analytics event on mount", () => {
		render(
			<ToolViewTracker
				toolSlug="expense-categorizer"
				toolName="Expense Categorizer"
			/>,
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_page_viewed",
			props: {
				tool_slug: "expense-categorizer",
				tool_name: "Expense Categorizer",
			},
		});
	});
});
