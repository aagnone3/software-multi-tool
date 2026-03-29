import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { FinalCta } from "./FinalCta";

describe("FinalCta", () => {
	it("renders the heading", () => {
		render(<FinalCta />);
		expect(
			screen.getByText("Try it free. First results in under 2 minutes."),
		).toBeInTheDocument();
	});

	it("renders Start Free link pointing to signup", () => {
		render(<FinalCta />);
		const link = screen.getByRole("link", {
			name: /start free — no card needed/i,
		});
		expect(link).toHaveAttribute("href", "/auth/signup");
	});

	it("renders Browse All Tools link", () => {
		render(<FinalCta />);
		const link = screen.getByRole("link", { name: /browse all tools/i });
		expect(link).toHaveAttribute("href", "/tools");
	});

	it("renders all benefit items", () => {
		render(<FinalCta />);
		expect(screen.getByText("No credit card required")).toBeInTheDocument();
		expect(
			screen.getByText("Free credits included on signup"),
		).toBeInTheDocument();
		expect(
			screen.getByText("First result in under 2 minutes"),
		).toBeInTheDocument();
	});
});
