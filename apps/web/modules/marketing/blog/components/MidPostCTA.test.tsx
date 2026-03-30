import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MidPostCTA } from "./MidPostCTA";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("MidPostCTA", () => {
	it("renders the headline copy", () => {
		render(<MidPostCTA />);
		expect(screen.getByText(/skip the manual work/i)).toBeTruthy();
	});

	it("renders the sub-copy", () => {
		render(<MidPostCTA />);
		expect(screen.getByText(/no credit card required/i)).toBeTruthy();
	});

	it("renders a signup link pointing to /auth/signup", () => {
		render(<MidPostCTA />);
		const link = screen.getByRole("link", { name: /get started free/i });
		expect(link).toBeTruthy();
		expect((link as HTMLAnchorElement).href).toContain("/auth/signup");
	});

	it("renders inside an aside element", () => {
		render(<MidPostCTA />);
		expect(screen.getByRole("complementary")).toBeTruthy();
	});
});
