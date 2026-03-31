import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BlogCTA } from "./BlogCTA";

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
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

describe("BlogCTA", () => {
	it("renders the headline", () => {
		render(<BlogCTA />);
		expect(screen.getByText(/try it yourself/i)).toBeTruthy();
	});

	it("renders the sub-copy mentioning free credits", () => {
		render(<BlogCTA />);
		expect(screen.getByText(/free credits/i)).toBeTruthy();
	});

	it("renders a 'Get started free' signup link", () => {
		render(<BlogCTA />);
		const link = screen.getByRole("link", { name: /get started free/i });
		expect(link).toBeTruthy();
		expect((link as HTMLAnchorElement).href).toContain("/auth/signup");
	});

	it("renders a pricing link", () => {
		render(<BlogCTA />);
		const pricingLink = screen.getByRole("link", {
			name: /see all tools/i,
		});
		expect(pricingLink).toBeTruthy();
		expect((pricingLink as HTMLAnchorElement).href).toContain("/pricing");
	});
});
