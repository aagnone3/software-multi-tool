import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import PricingPage from "./page";

vi.mock("@marketing/home/components/PricingSection", () => ({
	PricingSection: () => <section data-testid="pricing-section" />,
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

describe("PricingPage", () => {
	it("renders the main pricing heading", () => {
		render(<PricingPage />);
		expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
	});

	it("renders the PricingSection component", () => {
		render(<PricingPage />);
		expect(
			document.querySelector("[data-testid='pricing-section']"),
		).toBeInTheDocument();
	});

	it("renders a sign-up CTA link", () => {
		render(<PricingPage />);
		const links = screen.getAllByRole("link");
		const signupLink = links.find((a) =>
			a.getAttribute("href")?.includes("signup"),
		);
		expect(signupLink).toBeDefined();
	});

	it("renders a FAQ or questions section heading", () => {
		render(<PricingPage />);
		const h2s = screen.getAllByRole("heading", { level: 2 });
		expect(h2s.length).toBeGreaterThan(1);
	});
});
