import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
	it("renders the headline", () => {
		render(<Hero />);
		expect(
			screen.getByText(/stop wasting hours on tasks/i),
		).toBeInTheDocument();
	});

	it("renders Try Free CTA link to signup", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /try free/i });
		expect(link).toHaveAttribute("href", "/auth/signup");
	});

	it("renders See All Tools link", () => {
		render(<Hero />);
		const link = screen.getByRole("link", { name: /see all tools/i });
		expect(link).toHaveAttribute("href", "/tools");
	});

	it("renders setup time text with specific free credit count", () => {
		render(<Hero />);
		expect(
			screen.getByText(
				/set up in under 2 minutes · 10 free credits included/i,
			),
		).toBeInTheDocument();
	});

	it("renders highlight list items", () => {
		render(<Hero />);
		expect(
			screen.getByText(/summarizes a 1-hour meeting/i),
		).toBeInTheDocument();
	});
});
