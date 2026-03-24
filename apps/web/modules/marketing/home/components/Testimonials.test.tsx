import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Testimonials } from "./Testimonials";

describe("Testimonials", () => {
	it("renders the section heading", () => {
		render(<Testimonials />);
		expect(
			screen.getByText("Real businesses, real results"),
		).toBeInTheDocument();
	});

	it("renders all 6 testimonials", () => {
		render(<Testimonials />);
		const cards = screen
			.getAllByText(/"/i)
			.filter((el) => el.tagName === "BLOCKQUOTE");
		expect(cards.length).toBe(6);
	});

	it("renders customer names", () => {
		render(<Testimonials />);
		expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
		expect(screen.getByText("Marcus Rivera")).toBeInTheDocument();
		expect(screen.getByText("David Kim")).toBeInTheDocument();
	});

	it("renders company names", () => {
		render(<Testimonials />);
		expect(screen.getByText(/Bright Path Consulting/)).toBeInTheDocument();
		expect(screen.getByText(/Clear Signal Media/)).toBeInTheDocument();
	});

	it("renders star ratings with aria-labels", () => {
		render(<Testimonials />);
		const ratings = screen.getAllByLabelText("5 out of 5 stars");
		expect(ratings.length).toBe(6);
	});

	it("renders avatar initials", () => {
		render(<Testimonials />);
		expect(screen.getByText("SC")).toBeInTheDocument();
		expect(screen.getByText("MR")).toBeInTheDocument();
		expect(screen.getByText("PN")).toBeInTheDocument();
	});

	it("renders social proof text", () => {
		render(<Testimonials />);
		expect(screen.getByText(/500\+/)).toBeInTheDocument();
		expect(
			screen.getByText(/small businesses and freelancers/),
		).toBeInTheDocument();
	});

	it("has the testimonials section id for anchor links", () => {
		render(<Testimonials />);
		const section = document.getElementById("testimonials");
		expect(section).not.toBeNull();
	});
});
