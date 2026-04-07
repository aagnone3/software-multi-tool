import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolsMarketingPage from "./page";

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		tools: {
			registry: [
				{
					slug: "meeting-summarizer",
					name: "Meeting Summarizer",
					description: "Summarize meetings",
					icon: "clipboard-list",
					enabled: true,
					creditCost: 1,
					public: true,
				},
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					description: "Process invoices",
					icon: "receipt",
					enabled: true,
					creditCost: 2,
					public: false,
				},
				{
					slug: "disabled-tool",
					name: "Disabled Tool",
					description: "Not shown",
					icon: "file-text",
					enabled: false,
					creditCost: 1,
					public: true,
				},
			],
		},
	},
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

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		asChild,
		...props
	}: {
		children: React.ReactNode;
		asChild?: boolean;
	}) =>
		asChild ? (
			children
		) : (
			<button type="button" {...props}>
				{children}
			</button>
		),
}));

vi.mock("lucide-react", () => ({
	ArrowRightIcon: () => <svg data-testid="arrow-right" />,
	SparklesIcon: () => <svg data-testid="sparkles" />,
	ReceiptIcon: () => <svg data-testid="receipt" />,
	ClipboardListIcon: () => <svg data-testid="clipboard" />,
	NewspaperIcon: () => <svg data-testid="newspaper" />,
	FileTextIcon: () => <svg data-testid="file-text" />,
	WalletIcon: () => <svg data-testid="wallet" />,
	SeparatorHorizontalIcon: () => <svg data-testid="separator" />,
	ImageMinusIcon: () => <svg data-testid="image-minus" />,
	AudioLinesIcon: () => <svg data-testid="audio-lines" />,
}));

describe("ToolsMarketingPage", () => {
	it("renders the hero section", () => {
		render(<ToolsMarketingPage />);
		expect(
			screen.getByText(/every tool your team needs/i),
		).toBeInTheDocument();
	});

	it("renders only enabled tools", () => {
		render(<ToolsMarketingPage />);
		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.queryByText("Disabled Tool")).not.toBeInTheDocument();
	});

	it("shows sign-in badge for non-public tools", () => {
		render(<ToolsMarketingPage />);
		const signInElements = screen.getAllByText("Sign in");
		expect(signInElements.length).toBeGreaterThan(0);
	});

	it("renders credit cost per tool", () => {
		render(<ToolsMarketingPage />);
		expect(screen.getByText("1 credit per run")).toBeInTheDocument();
	});

	it("renders a CTA to sign up with explicit 10 free credits copy", () => {
		render(<ToolsMarketingPage />);
		const links = screen.getAllByRole("link", {
			name: /start with 10 free credits/i,
		});
		expect(links.length).toBeGreaterThan(0);
		expect(
			screen.getByText(
				/Start with 10 free credits\. No credit card required\./i,
			),
		).toBeInTheDocument();
	});

	it("renders ItemList JSON-LD structured data for tools", () => {
		const { container } = render(<ToolsMarketingPage />);
		const scripts = container.querySelectorAll(
			'script[type="application/ld+json"]',
		);
		const jsonLdTexts = Array.from(scripts).map((s) =>
			JSON.parse(s.textContent ?? "{}"),
		);
		const itemList = jsonLdTexts.find((j) => j["@type"] === "ItemList");
		expect(itemList).toBeDefined();
		expect(itemList?.numberOfItems).toBe(2);
		expect(itemList?.itemListElement[0].name).toBe("Meeting Summarizer");
		expect(itemList?.itemListElement[0].url).toBe(
			"https://example.com/tools/meeting-summarizer",
		);
	});
});
