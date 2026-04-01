import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import VsPage from "./page";

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

vi.mock("lucide-react", () => ({
	ArrowRightIcon: () => <svg data-testid="arrow-right" />,
}));

describe("VsPage", () => {
	it("renders the page heading", () => {
		render(<VsPage />);
		expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
	});

	it("renders comparison links", () => {
		render(<VsPage />);
		// Should have links to individual competitor comparison pages
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
	});
});
