import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NotFound } from "./NotFound";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("NotFound", () => {
	it("renders 404 heading", () => {
		render(<NotFound />);
		expect(screen.getByText("404")).toBeInTheDocument();
	});

	it("renders page not found message", () => {
		render(<NotFound />);
		expect(screen.getByText("Page not found")).toBeInTheDocument();
	});

	it("renders go to homepage link", () => {
		render(<NotFound />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/");
	});
});
