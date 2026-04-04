import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
	},
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
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

vi.mock("lucide-react", () => ({
	ArrowRightIcon: () => <svg data-testid="arrow-right" />,
	CheckCircleIcon: () => <svg data-testid="check-circle" />,
	DollarSignIcon: () => <svg data-testid="dollar-sign" />,
	GlobeIcon: () => <svg data-testid="globe" />,
	HandshakeIcon: () => <svg data-testid="handshake" />,
	LayoutDashboardIcon: () => <svg data-testid="layout-dashboard" />,
	LineChartIcon: () => <svg data-testid="line-chart" />,
	MegaphoneIcon: () => <svg data-testid="megaphone" />,
	StarIcon: () => <svg data-testid="star" />,
	UsersIcon: () => <svg data-testid="users" />,
}));

describe("PartnersPage", () => {
	it("renders main heading", async () => {
		const { default: PartnersPage } = await import("./page");
		render(<PartnersPage />);
		expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
	});

	it("renders affiliate tier", async () => {
		const { default: PartnersPage } = await import("./page");
		render(<PartnersPage />);
		expect(screen.getAllByText(/affiliate/i).length).toBeGreaterThan(0);
	});

	it("renders commission information", async () => {
		const { default: PartnersPage } = await import("./page");
		render(<PartnersPage />);
		expect(screen.getAllByText(/30%/).length).toBeGreaterThan(0);
	});

	it("has metadata with partner program title", async () => {
		const { metadata } = await import("./page");
		expect(String(metadata.title)).toContain("Partner");
	});

	it("renders JSON-LD structured data script tag", async () => {
		const { default: PartnersPage } = await import("./page");
		const { container } = render(<PartnersPage />);
		const script = container.querySelector(
			'script[type="application/ld+json"]',
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.innerHTML ?? "{}");
		expect(parsed["@type"]).toBe("Service");
		expect(parsed.serviceType).toBe("Affiliate Program");
	});
});
