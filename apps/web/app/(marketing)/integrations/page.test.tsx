import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import IntegrationsPage from "./page";

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
	},
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

describe("IntegrationsPage", () => {
	it("renders the page heading", () => {
		render(<IntegrationsPage />);
		expect(
			screen.getByText("Works with the tools you already use"),
		).toBeDefined();
	});

	it("shows Available now section", () => {
		render(<IntegrationsPage />);
		expect(screen.getByText("Available now")).toBeDefined();
	});

	it("shows Coming soon section", () => {
		render(<IntegrationsPage />);
		expect(screen.getByText("Coming soon")).toBeDefined();
	});

	it("shows CSV / File Upload as available", () => {
		render(<IntegrationsPage />);
		expect(screen.getByText("CSV / File Upload")).toBeDefined();
		expect(screen.getByText("Available")).toBeDefined();
	});

	it("shows coming-soon integrations", () => {
		render(<IntegrationsPage />);
		expect(screen.getByText("Google Drive")).toBeDefined();
		expect(screen.getByText("Slack")).toBeDefined();
		expect(screen.getByText("Zapier")).toBeDefined();
	});

	it("shows request integration CTA", () => {
		render(<IntegrationsPage />);
		expect(screen.getByText("Request an integration")).toBeDefined();
	});

	it("links to contact page from CTA", () => {
		render(<IntegrationsPage />);
		const links = screen.getAllByRole("link");
		const contactLinks = links.filter(
			(l) => l.getAttribute("href") === "/contact",
		);
		expect(contactLinks.length).toBeGreaterThan(0);
	});
});
