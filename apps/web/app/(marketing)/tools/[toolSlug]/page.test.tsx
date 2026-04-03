import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		tools: {
			registry: [
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					description: "Process invoices with AI",
					enabled: true,
					creditCost: 2,
					icon: "receipt",
					category: "finance",
				},
			],
		},
	},
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://testapp.com",
}));

vi.mock("next/navigation", () => ({
	notFound: () => {
		throw new Error("notFound");
	},
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
	ClipboardListIcon: () => <span>📋</span>,
	FileTextIcon: () => <span>📄</span>,
	ImageMinusIcon: () => <span>🖼</span>,
	NewspaperIcon: () => <span>📰</span>,
	ReceiptIcon: () => <span>🧾</span>,
	SeparatorHorizontalIcon: () => <span>—</span>,
	SparklesIcon: () => <span>✨</span>,
	WalletIcon: () => <span>💳</span>,
}));

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => null,
}));

vi.mock("next/image", () => ({
	default: ({ src, alt }: { src: string; alt: string }) => {
		// biome-ignore lint/performance/noImgElement: test mock only
		return <img src={src} alt={alt} />;
	},
}));

import ToolPage, { generateMetadata } from "./page";

describe("ToolPage (marketing)", () => {
	it("renders tool page for known tool slug", async () => {
		const Page = await ToolPage({
			params: Promise.resolve({ toolSlug: "invoice-processor" }),
		});
		render(Page);
		expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
	});

	it("throws notFound for unknown tool slug", async () => {
		await expect(
			ToolPage({
				params: Promise.resolve({ toolSlug: "unknown-tool" }),
			}),
		).rejects.toThrow("notFound");
	});

	it("generates metadata for known tool", async () => {
		const metadata = await generateMetadata({
			params: Promise.resolve({ toolSlug: "invoice-processor" }),
		});
		expect(metadata.title).toContain("Invoice Processor");
	});
});
