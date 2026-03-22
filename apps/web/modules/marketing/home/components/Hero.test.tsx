import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
	it("renders the headline", () => {
		render(<Hero />);
		expect(screen.getAllByText(/AI-powered/i).length).toBeGreaterThan(0);
	});

	it("renders Get Started Free link", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /get started free/i });
		expect(link).toHaveAttribute("href", "/auth/signup");
	});

	it("renders See How It Works link", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /see how it works/i });
		expect(link).toHaveAttribute("href", "#how-it-works");
	});

	it("renders no credit card required text", () => {
		render(<Hero />);
		expect(
			screen.getByText(/no credit card required/i),
		).toBeInTheDocument();
	});
});
