import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.hoisted(() => vi.fn());

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { UsageHistoryTracker } from "./UsageHistoryTracker";

describe("UsageHistoryTracker", () => {
	it("fires usage_history_page_viewed on mount", () => {
		render(<UsageHistoryTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "usage_history_page_viewed",
			props: {},
		});
	});

	it("renders nothing", () => {
		const { container } = render(<UsageHistoryTracker />);
		expect(container.firstChild).toBeNull();
	});
});
