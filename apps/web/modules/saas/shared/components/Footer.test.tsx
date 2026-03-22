import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "./Footer";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

describe("Footer", () => {
	it("renders the built-by link", () => {
		render(<Footer />);
		expect(
			screen.getByText("Built by Software Multitool"),
		).toBeInTheDocument();
	});

	it("renders privacy policy link", () => {
		render(<Footer />);
		const link = screen.getByText("Privacy policy");
		expect(link).toBeInTheDocument();
		expect(link.getAttribute("href")).toBe("/legal/privacy-policy");
	});

	it("renders terms link", () => {
		render(<Footer />);
		const link = screen.getByText("Terms and conditions");
		expect(link).toBeInTheDocument();
		expect(link.getAttribute("href")).toBe("/legal/terms");
	});
});
