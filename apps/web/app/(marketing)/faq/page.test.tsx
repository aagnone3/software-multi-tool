import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import FaqPage from "./page";

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

describe("FaqPage", () => {
	it("renders the FAQ heading", () => {
		render(<FaqPage />);
		expect(
			screen.getByRole("heading", {
				name: /frequently asked questions/i,
			}),
		).toBeInTheDocument();
	});

	it("renders multiple FAQ section headings", () => {
		render(<FaqPage />);
		// Several section headings should be present
		const h2s = screen.getAllByRole("heading", { level: 2 });
		expect(h2s.length).toBeGreaterThan(2);
	});

	it("renders question and answer pairs", () => {
		render(<FaqPage />);
		// At least some dt (question) elements should be present
		const questions = document.querySelectorAll("dt");
		expect(questions.length).toBeGreaterThan(3);
	});

	it("renders a contact/support CTA", () => {
		render(<FaqPage />);
		expect(screen.getByText(/still have questions/i)).toBeInTheDocument();
	});

	it("mentions the explicit 10 free credits offer", () => {
		render(<FaqPage />);
		expect(screen.getAllByText(/10 free credits/i).length).toBeGreaterThan(
			0,
		);
	});

	it("renders a link to the contact page", () => {
		render(<FaqPage />);
		const contactLink = screen
			.getAllByRole("link")
			.find((a) => a.getAttribute("href")?.includes("contact"));
		expect(contactLink).toBeDefined();
	});
});
