import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import UseCasesPage from "./page";

vi.mock("@repo/config", () => ({
	config: { appName: "TestApp" },
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://test.example.com",
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

vi.mock("@marketing/shared/components/UseCasesPageTracker", () => ({
	UseCasesPageTracker: () => null,
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

describe("UseCasesPage", () => {
	it("renders a heading", () => {
		render(<UseCasesPage />);
		const headings = screen.getAllByRole("heading");
		expect(headings.length).toBeGreaterThan(0);
	});

	it("renders a signup link", () => {
		render(<UseCasesPage />);
		const links = screen.getAllByRole("link");
		const signupLink = links.find((l) =>
			l.getAttribute("href")?.includes("signup"),
		);
		expect(signupLink).toBeDefined();
	});

	it("uses public tool landing links on use-case cards", () => {
		render(<UseCasesPage />);
		const links = screen.getAllByRole("link");
		const publicToolLinks = links.filter((l) =>
			l.getAttribute("href")?.startsWith("/tools/"),
		);
		const appToolLinks = links.filter((l) =>
			l.getAttribute("href")?.startsWith("/app/tools/"),
		);

		expect(publicToolLinks.length).toBeGreaterThan(0);
		expect(appToolLinks.length).toBe(0);
	});

	it("shows specific 10-credit CTA copy", () => {
		render(<UseCasesPage />);
		expect(
			screen.getByText(
				/Get started free — 10 credits, no card required/i,
			),
		).toBeInTheDocument();
	});
});
