import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { ChoosePlanTracker } from "./ChoosePlanTracker";

describe("ChoosePlanTracker", () => {
	it("fires choose_plan_page_viewed on mount", () => {
		render(<ChoosePlanTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "choose_plan_page_viewed",
			props: {},
		});
	});

	it("renders nothing", () => {
		const { container } = render(<ChoosePlanTracker />);
		expect(container.firstChild).toBeNull();
	});
});
