import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { RelatedToolCta } from "./RelatedToolCta";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
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
		expect(
			screen.getByText(/start with 10 free credits — no card required/i),
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

	it("tracks related_tool_cta_clicked when primary CTA is clicked", async () => {
		const user = userEvent.setup();
		render(<RelatedToolCta tags={["contracts"]} />);
		const ctaLink = screen.getByRole("link", {
			name: /analyze a contract free/i,
		});
		await user.click(ctaLink);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "related_tool_cta_clicked",
			props: {
				tool_slug: "contract-analyzer",
				source_tags: "contracts",
				cta_text: "Analyze a Contract Free",
			},
		});
	});

	it("tracks related_tool_learn_more_clicked when learn more is clicked", async () => {
		const user = userEvent.setup();
		render(<RelatedToolCta tags={["invoices"]} />);
		const learnMore = screen.getByRole("link", { name: /learn more/i });
		await user.click(learnMore);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "related_tool_learn_more_clicked",
			props: {
				tool_slug: "invoice-processor",
				source_tags: "invoices",
			},
		});
	});

	it("includes all tags in source_tags when multiple tags provided", async () => {
		const user = userEvent.setup();
		render(<RelatedToolCta tags={["contracts", "finance"]} />);
		const ctaLink = screen.getByRole("link", {
			name: /analyze a contract free/i,
		});
		await user.click(ctaLink);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({
				props: expect.objectContaining({
					source_tags: "contracts,finance",
				}),
			}),
		);
	});
});
