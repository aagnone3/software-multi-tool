import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import CaseStudiesPage from "./page";

vi.mock("@repo/config", () => ({
	config: { appName: "TestApp" },
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
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

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

describe("CaseStudiesPage", () => {
	it("renders the hero heading", () => {
		render(<CaseStudiesPage />);
		expect(screen.getByText(/how teams save/i)).toBeInTheDocument();
	});

	it("renders at least one case study", () => {
		render(<CaseStudiesPage />);
		expect(screen.getByText("Boutique Law Firm")).toBeInTheDocument();
	});

	it("renders summary stats section", () => {
		render(<CaseStudiesPage />);
		expect(screen.getByText("10–22 hrs")).toBeInTheDocument();
	});

	it("renders a CTA to sign up", () => {
		render(<CaseStudiesPage />);
		const links = screen.getAllByRole("link", { name: /start for free/i });
		expect(links.length).toBeGreaterThan(0);
	});

	it("renders quotes from customers", () => {
		render(<CaseStudiesPage />);
		// At least one blockquote with a quote from a customer
		expect(screen.getByText(/we used to dread/i)).toBeInTheDocument();
	});

	it("renders StickyCta", () => {
		render(<CaseStudiesPage />);
		expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
	});
});
