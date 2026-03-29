import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { BillingTrustSection } from "./BillingTrustSection";

describe("BillingTrustSection", () => {
	it("renders the section heading", () => {
		render(<BillingTrustSection />);
		expect(screen.getByText(/our commitment to you/i)).toBeInTheDocument();
	});

	it("renders money-back guarantee item", () => {
		render(<BillingTrustSection />);
		expect(
			screen.getByText(/14-day money-back guarantee/i),
		).toBeInTheDocument();
	});

	it("renders cancel anytime item", () => {
		render(<BillingTrustSection />);
		expect(screen.getByText(/cancel anytime/i)).toBeInTheDocument();
	});

	it("renders secure payment item", () => {
		render(<BillingTrustSection />);
		expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
	});

	it("renders no hidden fees item", () => {
		render(<BillingTrustSection />);
		expect(screen.getByText(/no hidden fees/i)).toBeInTheDocument();
	});

	it("accepts custom className", () => {
		const { container } = render(
			<BillingTrustSection className="custom-class" />,
		);
		expect(container.firstChild).toHaveClass("custom-class");
	});
});
