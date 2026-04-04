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
});
