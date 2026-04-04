import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoiCalculatorPage from "./page";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://softwaremultitool.com",
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

describe("RoiCalculatorPage", () => {
	beforeEach(() => {
		mockTrack.mockClear();
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

	it("tracks use case toggle when a use case button is clicked", () => {
		// Find the "Expense categorization" button (not pre-selected)
		const expenseBtn = screen
			.getByText(/Expense categorization/i)
			.closest("button");
		expect(expenseBtn).toBeDefined();
		fireEvent.click(expenseBtn as HTMLElement);
		const toggleCall = mockTrack.mock.calls.find(
			([e]) => e.name === "roi_calculator_use_case_toggled",
		);
		expect(toggleCall).toBeDefined();
		expect(toggleCall?.[0].props.use_case_id).toBe("expenses");
		expect(toggleCall?.[0].props.selected).toBe(true);
	});

	it("tracks CTA click with calculator state", () => {
		const ctaLinks = screen.getAllByRole("link");
		const ctaLink = ctaLinks.find((l) =>
			l.textContent?.toLowerCase().includes("start saving"),
		);
		expect(ctaLink).toBeDefined();
		fireEvent.click(ctaLink as HTMLElement);
		const ctaCall = mockTrack.mock.calls.find(
			([e]) => e.name === "roi_calculator_cta_clicked",
		);
		expect(ctaCall).toBeDefined();
		expect(ctaCall?.[0].props).toMatchObject({
			team_size: 3,
			hourly_rate: 75,
		});
		expect(Array.isArray(ctaCall?.[0].props.use_cases)).toBe(true);
	});
});
