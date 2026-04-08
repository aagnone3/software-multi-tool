import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ForIndexPage from "./page";

vi.mock("@repo/config", () => ({
	config: { appName: "TestApp" },
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://test.example.com",
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
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

describe("ForIndexPage", () => {
	it("renders industry cards", () => {
		render(<ForIndexPage />);
		expect(
			screen.getByRole("heading", { name: /Accountants & Bookkeepers/i }),
		).toBeInTheDocument();
	});

	it("shows explicit 10-credit footer CTA copy", () => {
		render(<ForIndexPage />);
		expect(
			screen.getByText(
				/Start with 10 free credits, no credit card required\./i,
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Start with 10 free credits/i }),
		).toHaveAttribute("href", "/auth/signup");
	});
});
