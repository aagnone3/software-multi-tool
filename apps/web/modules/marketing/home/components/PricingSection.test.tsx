import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PricingSection } from "./PricingSection";

vi.mock("@saas/payments/components/PricingTable", () => ({
	PricingTable: () => <div data-testid="pricing-table">PricingTable</div>,
}));

vi.mock("./PricingFaq", () => ({
	PricingFaq: () => <div data-testid="pricing-faq">PricingFaq</div>,
}));

vi.mock("./PricingTrustBar", () => ({
	PricingTrustBar: () => (
		<div data-testid="pricing-trust-bar">PricingTrustBar</div>
	),
}));

describe("PricingSection", () => {
	it("renders the section heading", () => {
		render(<PricingSection />);
		expect(
			screen.getByText("Pay only for what you use"),
		).toBeInTheDocument();
	});

	it("renders the pricing descriptor with the explicit free-credit offer", () => {
		render(<PricingSection />);
		expect(
			screen.getByText(
				/Start with 10 free credits\. Add credits as you grow\./,
			),
		).toBeInTheDocument();
	});

	it("renders Simple, transparent pricing label", () => {
		render(<PricingSection />);
		expect(
			screen.getByText(/Simple, transparent pricing/i),
		).toBeInTheDocument();
	});

	it("renders PricingTable", () => {
		render(<PricingSection />);
		expect(screen.getByTestId("pricing-table")).toBeInTheDocument();
	});

	it("renders PricingTrustBar", () => {
		render(<PricingSection />);
		expect(screen.getByTestId("pricing-trust-bar")).toBeInTheDocument();
	});

	it("renders PricingFaq", () => {
		render(<PricingSection />);
		expect(screen.getByTestId("pricing-faq")).toBeInTheDocument();
	});

	it("has id=pricing for anchor navigation", () => {
		const { container } = render(<PricingSection />);
		const section = container.querySelector("section#pricing");
		expect(section).not.toBeNull();
	});
});
