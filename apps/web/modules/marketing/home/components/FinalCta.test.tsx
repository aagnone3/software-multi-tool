import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { FinalCta } from "./FinalCta";

describe("FinalCta", () => {
	beforeEach(() => {
		mockTrack.mockClear();
	});

	it("renders start free and browse tools links", () => {
		render(<FinalCta />);
		expect(
			screen.getByText(/Start Free — No Card Needed/i),
		).toBeInTheDocument();
		expect(screen.getByText(/Browse All Tools/i)).toBeInTheDocument();
	});

	it("tracks start_free click", () => {
		render(<FinalCta />);
		fireEvent.click(screen.getByText(/Start Free — No Card Needed/i));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_final_cta_clicked",
			props: { cta: "start_free" },
		});
	});

	it("tracks browse_tools click", () => {
		render(<FinalCta />);
		fireEvent.click(screen.getByText(/Browse All Tools/i));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_final_cta_clicked",
			props: { cta: "browse_tools" },
		});
	});
});
