import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { FinalCta } from "./FinalCta";

describe("FinalCta", () => {
	it("renders the heading", () => {
		render(<FinalCta />);
		expect(
			screen.getByText("Ready to transform your productivity with AI?"),
		).toBeInTheDocument();
	});

	it("renders Get Started Free link pointing to signup", () => {
		render(<FinalCta />);
		const link = screen.getByRole("link", { name: /get started free/i });
		expect(link).toHaveAttribute("href", "/auth/signup");
	});

	it("renders all benefit items", () => {
		render(<FinalCta />);
		expect(screen.getByText("No credit card required")).toBeInTheDocument();
		expect(
			screen.getByText("Free credits to get started"),
		).toBeInTheDocument();
		expect(screen.getByText("Cancel anytime")).toBeInTheDocument();
	});
});
