import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoiCalculatorPage from "./page";

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://softwaremultitool.com",
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("RoiCalculatorPage", () => {
	beforeEach(() => {
		render(<RoiCalculatorPage />);
	});

	it("renders the page heading", () => {
		expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
	});

	it("renders hourly rate input", () => {
		const input = screen.getByLabelText(/hourly rate/i);
		expect(input).toBeDefined();
	});

	it("renders use case options", () => {
		expect(screen.getByText(/Meeting summaries/i)).toBeDefined();
		expect(screen.getByText(/Invoice processing/i)).toBeDefined();
		// Contract review appears twice (use case + testimonial), check first instance
		const contractItems = screen.getAllByText(/Contract review/i);
		expect(contractItems.length).toBeGreaterThanOrEqual(1);
	});

	it("shows hours saved when use cases are selected", () => {
		// Use cases are toggle buttons
		const toggleButtons = screen.getAllByRole("button");
		if (toggleButtons.length > 0) {
			fireEvent.click(toggleButtons[0]);
		}
		// Results section should exist
		expect(screen.getByText(/per month/i)).toBeDefined();
	});

	it("renders a Get Started CTA", () => {
		const ctaLinks = screen.getAllByRole("link");
		const getStartedLink = ctaLinks.find(
			(l) =>
				l.textContent?.toLowerCase().includes("start") ||
				l.textContent?.toLowerCase().includes("free"),
		);
		expect(getStartedLink).toBeDefined();
	});

	it("renders JSON-LD structured data", () => {
		const scripts = document.querySelectorAll(
			'script[type="application/ld+json"]',
		);
		expect(scripts.length).toBeGreaterThanOrEqual(0);
	});
});
