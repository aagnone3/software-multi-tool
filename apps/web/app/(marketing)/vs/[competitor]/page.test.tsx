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
	MinusCircleIcon: () => <span>~</span>,
	XCircleIcon: () => <span>✗</span>,
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

vi.mock("@marketing/shared/components/CompetitorPageTracker", () => ({
	CompetitorPageTracker: () => null,
}));

vi.mock("@marketing/shared/components/CompetitorCtaTracker", () => ({
	CompetitorCtaTracker: ({ children }: { children: React.ReactNode }) =>
		children,
}));

import CompetitorPage, { generateMetadata, generateStaticParams } from "./page";

describe("CompetitorPage", () => {
	it("renders comparison page for known competitor", async () => {
		const Page = await CompetitorPage({
			params: Promise.resolve({ competitor: "otter-ai" }),
		});
		render(Page);

		expect(screen.getAllByText(/Otter\.ai/i).length).toBeGreaterThan(0);
	});

	it("throws notFound for unknown competitor", async () => {
		await expect(
			CompetitorPage({
				params: Promise.resolve({ competitor: "no-such-tool" }),
			}),
		).rejects.toThrow("notFound");
	});

	it("generateStaticParams returns array with competitor slugs", async () => {
		const params = await generateStaticParams();
		expect(Array.isArray(params)).toBe(true);
		expect(params.length).toBeGreaterThan(0);
		expect(params[0]).toHaveProperty("competitor");
	});

	it("generateMetadata returns title for known competitor", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ competitor: "otter-ai" }),
		});
		expect(String(meta.title)).toContain("Otter.ai");
	});

	it("uses the explicit 10 free credits offer in competitor metadata", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ competitor: "nanonets" }),
		});
		expect(meta.description).toContain("10 free credits");
	});

	it("generateMetadata returns empty object for unknown competitor", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ competitor: "nope" }),
		});
		expect(meta).toEqual({});
	});

	it("renders StickyCta on competitor page", async () => {
		const Page = await CompetitorPage({
			params: Promise.resolve({ competitor: "chatgpt" }),
		});
		render(Page);
		expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
	});

	it("renders CompetitorPageTracker on competitor page", async () => {
		const Page = await CompetitorPage({
			params: Promise.resolve({ competitor: "notion-ai" }),
		});
		render(Page);
		// CompetitorPageTracker returns null but should not throw
		expect(screen.getAllByText(/Notion AI/i).length).toBeGreaterThan(0);
	});

	it("renders the explicit 10 free credits offer in the final CTA", async () => {
		const Page = await CompetitorPage({
			params: Promise.resolve({ competitor: "chatgpt" }),
		});
		render(Page);
		expect(
			screen.getByText(
				"Start with 10 free credits. No credit card required.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /start with 10 free credits/i }),
		).toHaveAttribute("href", "/auth/signup");
	});

	it("uses explicit free-credit framing in nanonets metadata", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ competitor: "nanonets" }),
		});

		expect(meta.description).toContain("Start with 10 free credits");
	});
});
