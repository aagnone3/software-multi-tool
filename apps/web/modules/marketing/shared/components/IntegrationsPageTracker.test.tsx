import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { IntegrationsPageTracker } from "./IntegrationsPageTracker";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("IntegrationsPageTracker", () => {
	it("fires integrations_page_viewed on mount", () => {
		render(<IntegrationsPageTracker />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "integrations_page_viewed",
			props: {},
		});
	});

	it("renders nothing", () => {
		const { container } = render(<IntegrationsPageTracker />);
		expect(container.firstChild).toBeNull();
	});
});
