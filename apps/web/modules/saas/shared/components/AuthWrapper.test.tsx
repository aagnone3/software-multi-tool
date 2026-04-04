import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthWrapper } from "./AuthWrapper";

vi.mock("@saas/shared/components/Footer", () => ({
	Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@shared/components/ColorModeToggle", () => ({
	ColorModeToggle: () => <div data-testid="color-mode-toggle" />,
}));

vi.mock("@shared/components/Logo", () => ({
	Logo: () => <div data-testid="logo">Logo</div>,
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

describe("AuthWrapper", () => {
	it("renders children inside the form card", () => {
		render(
			<AuthWrapper>
				<div data-testid="child-content">Form goes here</div>
			</AuthWrapper>,
		);
		expect(screen.getByTestId("child-content")).toBeTruthy();
	});

	it("renders the benefits sidebar", () => {
		render(
			<AuthWrapper>
				<div>Form</div>
			</AuthWrapper>,
		);
		expect(screen.getByText("Why teams love it")).toBeTruthy();
		expect(
			screen.getByText("10 free credits — no card required"),
		).toBeTruthy();
		expect(screen.getByText("Save 10+ hours per month")).toBeTruthy();
		expect(screen.getByText("9 tools in one platform")).toBeTruthy();
		expect(screen.getByText("Your data stays private")).toBeTruthy();
	});

	it("renders the testimonial with quote, author, and role", () => {
		render(
			<AuthWrapper>
				<div>Form</div>
			</AuthWrapper>,
		);
		const testimonial = screen.getByTestId("auth-testimonial");
		expect(testimonial).toBeTruthy();
		expect(screen.getByText(/I used to spend half my Friday/)).toBeTruthy();
		expect(screen.getByText("Sarah M.")).toBeTruthy();
		expect(
			screen.getByText("Operations Lead, Series B startup"),
		).toBeTruthy();
	});

	it("renders the star rating container with correct aria-label", () => {
		render(
			<AuthWrapper>
				<div>Form</div>
			</AuthWrapper>,
		);
		const starsContainer = screen.getByLabelText("5 out of 5 stars");
		expect(starsContainer).toBeTruthy();
	});

	it("renders logo and footer", () => {
		render(
			<AuthWrapper>
				<div>Form</div>
			</AuthWrapper>,
		);
		expect(screen.getByTestId("logo")).toBeTruthy();
		expect(screen.getByTestId("footer")).toBeTruthy();
	});

	it("applies custom contentClass to the form card and renders children", () => {
		render(
			<AuthWrapper contentClass="custom-test-class">
				<div data-testid="inner">Content</div>
			</AuthWrapper>,
		);
		expect(screen.getByTestId("inner")).toBeTruthy();
	});
});
