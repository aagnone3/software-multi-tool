import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "./Footer";

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		ui: { blog: { enabled: true } },
	},
}));

vi.mock("@shared/components/Logo", () => ({
	Logo: ({ className }: { className?: string }) => (
		<div data-testid="logo" className={className} />
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

describe("Footer", () => {
	it("renders the logo", () => {
		render(<Footer />);
		expect(screen.getByTestId("logo")).toBeTruthy();
	});

	it("renders app name in copyright", () => {
		render(<Footer />);
		expect(screen.getByText(/TestApp/)).toBeTruthy();
	});

	it("renders blog link when enabled", () => {
		render(<Footer />);
		const blogLinks = screen
			.getAllByRole("link")
			.filter((l) => l.getAttribute("href") === "/blog");
		expect(blogLinks.length).toBeGreaterThan(0);
	});

	it("renders privacy and terms links", () => {
		render(<Footer />);
		expect(screen.getByText(/Privacy policy/i)).toBeTruthy();
		expect(screen.getByText(/Terms and conditions/i)).toBeTruthy();
	});

	it("renders features and pricing anchors", () => {
		render(<Footer />);
		expect(screen.getByText("Features")).toBeTruthy();
		expect(screen.getByText("Pricing")).toBeTruthy();
	});
});
