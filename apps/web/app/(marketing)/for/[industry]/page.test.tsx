import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: { appName: "TestApp" },
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://testapp.com",
}));

const mockNotFound = vi.fn(() => {
	throw new Error("notFound");
});
vi.mock("next/navigation", () => ({
	notFound: () => mockNotFound(),
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
	ArrowRightIcon: () => <span>→</span>,
	CheckCircleIcon: () => <span>✓</span>,
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

import IndustryPage, { generateMetadata, generateStaticParams } from "./page";

describe("IndustryPage", () => {
	it("renders hero section for known industry", async () => {
		const Page = await IndustryPage({
			params: Promise.resolve({ industry: "accountants" }),
		});
		render(Page);

		expect(screen.getByText(/Automate the Busywork/i)).toBeInTheDocument();
		expect(
			screen.getAllByText(/Accountants & Bookkeepers/i).length,
		).toBeGreaterThan(0);
	});

	it("throws notFound for unknown industry", async () => {
		await expect(
			IndustryPage({
				params: Promise.resolve({ industry: "unknown-industry" }),
			}),
		).rejects.toThrow("notFound");
	});

	it("renders benefits list", async () => {
		const Page = await IndustryPage({
			params: Promise.resolve({ industry: "freelancers" }),
		});
		render(Page);

		expect(screen.getByText(/Reclaim 5\+ hours/i)).toBeInTheDocument();
	});

	it("generateStaticParams returns array of industry slugs", () => {
		const params = generateStaticParams();
		expect(Array.isArray(params)).toBe(true);
		expect(params.length).toBeGreaterThan(0);
		expect(params[0]).toHaveProperty("industry");
	});

	it("generateMetadata returns title for known industry", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ industry: "accountants" }),
		});
		expect(String(meta.title)).toContain("Accountants");
	});

	it("generateMetadata returns empty object for unknown industry", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ industry: "nope" }),
		});
		expect(meta).toEqual({});
	});

	it("renders Service JSON-LD structured data", async () => {
		const Page = await IndustryPage({
			params: Promise.resolve({ industry: "accountants" }),
		});
		const { container } = render(Page);

		const scripts = container.querySelectorAll(
			'script[type="application/ld+json"]',
		);
		const jsonLdContents = Array.from(scripts).map((s) =>
			JSON.parse(s.innerHTML),
		);

		const service = jsonLdContents.find((d) => d["@type"] === "Service");
		expect(service).toBeDefined();
		expect(service?.name).toContain("Accountants");
		expect(service?.provider?.name).toBe("TestApp");
		expect(service?.audience?.audienceType).toContain("Accountants");
		expect(service?.offers?.description).toBe(
			"Start with 10 free credits. No credit card required.",
		);
	});

	it("renders BreadcrumbList JSON-LD structured data", async () => {
		const Page = await IndustryPage({
			params: Promise.resolve({ industry: "accountants" }),
		});
		const { container } = render(Page);

		const scripts = container.querySelectorAll(
			'script[type="application/ld+json"]',
		);
		const jsonLdContents = Array.from(scripts).map((s) =>
			JSON.parse(s.innerHTML),
		);

		const breadcrumb = jsonLdContents.find(
			(d) => d["@type"] === "BreadcrumbList",
		);
		expect(breadcrumb).toBeDefined();
		expect(breadcrumb?.itemListElement).toHaveLength(3);
	});
});
