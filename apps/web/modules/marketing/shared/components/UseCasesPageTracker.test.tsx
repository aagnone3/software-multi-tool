import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { UseCasesPageTracker } from "./UseCasesPageTracker";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("UseCasesPageTracker", () => {
	it("fires use_cases_page_viewed on mount", () => {
		render(<UseCasesPageTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "use_cases_page_viewed",
			props: {},
		});
	});

	it("renders nothing", () => {
		const { container } = render(<UseCasesPageTracker />);
		expect(container.firstChild).toBeNull();
	});
});
