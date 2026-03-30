import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { RelatedToolCta } from "./RelatedToolCta";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("RelatedToolCta", () => {
	it("renders nothing when no tags match", () => {
		const { container } = render(<RelatedToolCta tags={["random-tag"]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when tags are empty", () => {
		const { container } = render(<RelatedToolCta tags={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when tags prop is omitted", () => {
		const { container } = render(<RelatedToolCta />);
		expect(container.firstChild).toBeNull();
	});

	it("renders Contract Analyzer for 'contracts' tag", () => {
		render(<RelatedToolCta tags={["contracts"]} />);
		expect(screen.getByText("Contract Analyzer")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /analyze a contract free/i }),
		).toBeTruthy();
	});

	it("renders Contract Analyzer for 'legal' tag", () => {
		render(<RelatedToolCta tags={["legal"]} />);
		expect(screen.getByText("Contract Analyzer")).toBeTruthy();
	});

	it("renders Invoice Processor for 'invoices' tag", () => {
		render(<RelatedToolCta tags={["invoices"]} />);
		expect(screen.getByText("Invoice Processor")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /process an invoice free/i }),
		).toBeTruthy();
	});

	it("renders Expense Categorizer for 'finance' tag", () => {
		render(<RelatedToolCta tags={["finance"]} />);
		expect(screen.getByText("Expense Categorizer")).toBeTruthy();
	});

	it("renders Expense Categorizer for 'expenses' tag", () => {
		render(<RelatedToolCta tags={["expenses"]} />);
		expect(screen.getByText("Expense Categorizer")).toBeTruthy();
	});

	it("renders Meeting Summarizer for 'meetings' tag", () => {
		render(<RelatedToolCta tags={["meetings"]} />);
		expect(screen.getByText("Meeting Summarizer")).toBeTruthy();
	});

	it("renders Meeting Summarizer for 'productivity' tag", () => {
		render(<RelatedToolCta tags={["productivity"]} />);
		expect(screen.getByText("Meeting Summarizer")).toBeTruthy();
	});

	it("renders Feedback Analyzer for 'feedback' tag", () => {
		render(<RelatedToolCta tags={["feedback"]} />);
		expect(screen.getByText("Feedback Analyzer")).toBeTruthy();
	});

	it("renders Speaker Separation for 'audio' tag", () => {
		render(<RelatedToolCta tags={["audio"]} />);
		expect(screen.getByText("Speaker Separation")).toBeTruthy();
	});

	it("renders News Analyzer for 'news' tag", () => {
		render(<RelatedToolCta tags={["news"]} />);
		expect(screen.getByText("News Analyzer")).toBeTruthy();
	});

	it("matches the first applicable tag when multiple tags are provided", () => {
		// 'contracts' comes first and matches
		render(<RelatedToolCta tags={["contracts", "finance"]} />);
		expect(screen.getByText("Contract Analyzer")).toBeTruthy();
	});

	it("CTA link includes signup redirect to the tool", () => {
		render(<RelatedToolCta tags={["contracts"]} />);
		const ctaLink = screen.getByRole("link", {
			name: /analyze a contract free/i,
		});
		expect((ctaLink as HTMLAnchorElement).href).toContain("/auth/signup");
		expect((ctaLink as HTMLAnchorElement).href).toContain(
			"contract-analyzer",
		);
	});

	it("learn more link points to the tool's marketing page", () => {
		render(<RelatedToolCta tags={["contracts"]} />);
		const learnMore = screen.getByRole("link", { name: /learn more/i });
		expect((learnMore as HTMLAnchorElement).href).toContain(
			"/tools/contract-analyzer",
		);
	});

	it("is case-insensitive for tag matching", () => {
		render(<RelatedToolCta tags={["Contracts"]} />);
		expect(screen.getByText("Contract Analyzer")).toBeTruthy();
	});
});
