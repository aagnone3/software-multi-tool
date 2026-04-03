import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { PricingTrustBar } from "./PricingTrustBar";

describe("PricingTrustBar", () => {
	it("renders user count", () => {
		render(<PricingTrustBar />);
		expect(screen.getByText("500+")).toBeInTheDocument();
		expect(screen.getByText(/teams/i)).toBeInTheDocument();
	});

	it("renders star rating", () => {
		render(<PricingTrustBar />);
		expect(screen.getByText("4.9/5")).toBeInTheDocument();
		expect(screen.getByText(/average rating/i)).toBeInTheDocument();
	});

	it("renders money-back guarantee", () => {
		render(<PricingTrustBar />);
		expect(screen.getByText("30-day")).toBeInTheDocument();
		expect(screen.getByText(/money-back guarantee/i)).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<PricingTrustBar className="custom-class" />,
		);
		expect(container.firstChild).toHaveClass("custom-class");
	});
});
