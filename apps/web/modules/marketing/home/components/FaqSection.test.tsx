import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { FaqSection } from "./FaqSection";

describe("FaqSection", () => {
	it("renders the section heading", () => {
		render(<FaqSection />);
		expect(
			screen.getByText("Frequently asked questions"),
		).toBeInTheDocument();
	});

	it("renders all FAQ items", () => {
		render(<FaqSection />);
		expect(
			screen.getByText("What is the refund policy?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("How do I cancel my subscription?"),
		).toBeInTheDocument();
		expect(screen.getByText("Can I change my plan?")).toBeInTheDocument();
		expect(
			screen.getByText("Do you offer a free trial?"),
		).toBeInTheDocument();
	});

	it("renders with className prop", () => {
		const { container } = render(<FaqSection className="custom-class" />);
		expect(container.firstChild).toHaveClass("custom-class");
	});
});
