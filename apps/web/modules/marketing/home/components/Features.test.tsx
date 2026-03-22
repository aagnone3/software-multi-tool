import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Features } from "./Features";

describe("Features", () => {
	it("renders the section heading", () => {
		render(<Features />);
		expect(
			screen.getByText("8 AI tools, ready to use today"),
		).toBeInTheDocument();
	});

	it("renders all 8 tool cards", () => {
		render(<Features />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Contract Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
		expect(
			screen.getByText("Customer Feedback Analyzer"),
		).toBeInTheDocument();
		expect(screen.getByText("Expense Categorizer")).toBeInTheDocument();
		expect(screen.getByText("Speaker Separation")).toBeInTheDocument();
		expect(screen.getByText("Background Remover")).toBeInTheDocument();
	});

	it("marks background remover as coming soon", () => {
		render(<Features />);
		expect(screen.getByText("Soon")).toBeInTheDocument();
	});

	it("renders Try it links for non-coming-soon tools", () => {
		render(<Features />);
		const links = screen.getAllByText("Try it →");
		expect(links.length).toBe(7);
	});

	it("renders a section element", () => {
		const { container } = render(<Features />);
		const section = container.querySelector("section");
		expect(section).toBeTruthy();
	});
});
