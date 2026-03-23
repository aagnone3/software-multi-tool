import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolViewTracker } from "./ToolViewTracker";

const mockRecordView = vi.fn();

vi.mock("@saas/tools/hooks/use-recently-viewed-tools", () => ({
	useRecentlyViewedTools: () => ({
		recentTools: [],
		recordView: mockRecordView,
	}),
}));

describe("ToolViewTracker", () => {
	it("renders nothing (returns null)", () => {
		const { container } = render(
			<ToolViewTracker toolSlug="news-analyzer" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("calls recordView with toolSlug on mount", () => {
		render(<ToolViewTracker toolSlug="contract-analyzer" />);
		expect(mockRecordView).toHaveBeenCalledWith("contract-analyzer");
	});
});
