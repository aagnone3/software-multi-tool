import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { ToolsIndexPageTracker } from "./ToolsIndexPageTracker";

describe("ToolsIndexPageTracker", () => {
	it("fires tools_index_page_viewed on mount", () => {
		render(<ToolsIndexPageTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tools_index_page_viewed",
			props: {},
		});
	});

	it("renders nothing visible", () => {
		const { container } = render(<ToolsIndexPageTracker />);
		expect(container.firstChild).toBeNull();
	});
});
