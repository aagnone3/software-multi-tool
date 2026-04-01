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

	it("generateMetadata returns empty object for unknown competitor", async () => {
		const meta = await generateMetadata({
			params: Promise.resolve({ competitor: "nope" }),
		});
		expect(meta).toEqual({});
	});
});
