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
			screen.getByText("Do you offer a free trial?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("How does credit-based pricing work?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("What file types are supported?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Can I use the tools for my whole team?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("How do I cancel my subscription?"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Is my data kept private?"),
		).toBeInTheDocument();
	});

	it("renders with className prop", () => {
		const { container } = render(<FaqSection className="custom-class" />);
		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("shows specific free credit count in free trial answer", () => {
		render(<FaqSection />);
		expect(screen.getByText(/10 free credits/i)).toBeInTheDocument();
	});
});
