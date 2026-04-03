import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { RelatedToolsWidget } from "./RelatedToolsWidget";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					description: "AI-powered news analysis",
					icon: "newspaper",
					enabled: true,
					public: false,
					creditCost: 5,
				},
				{
					slug: "contract-analyzer",
					name: "Contract Analyzer",
					description: "Analyze contracts with AI",
					icon: "file-text",
					enabled: true,
					public: false,
					creditCost: 10,
				},
				{
					slug: "meeting-summarizer",
					name: "Meeting Summarizer",
					description: "Summarize meeting transcripts",
					icon: "clipboard-list",
					enabled: true,
					public: false,
					creditCost: 3,
				},
				{
					slug: "speaker-separation",
					name: "Speaker Separation",
					description: "Separate audio speakers",
					icon: "users",
					enabled: true,
					public: false,
					creditCost: 20,
				},
				{
					slug: "disabled-tool",
					name: "Disabled Tool",
					description: "Not available",
					icon: "wrench",
					enabled: false,
					public: false,
					creditCost: 0,
				},
			],
		},
	},
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

describe("RelatedToolsWidget", () => {
	it("renders related tools for a given slug", () => {
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		expect(screen.getByText("You might also like")).toBeInTheDocument();
	});

	it("does not show the current tool in the related list", () => {
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		// news-analyzer should not appear as a related tool link
		const toolLinks = screen.getAllByRole("link");
		const newsAnalyzerLinks = toolLinks.filter(
			(l) =>
				l.getAttribute("href") === "/app/tools/news-analyzer" &&
				l.textContent?.includes("News Analyzer") &&
				!l.textContent?.includes("Browse all tools"),
		);
		expect(newsAnalyzerLinks).toHaveLength(0);
	});

	it("shows Browse all tools link", () => {
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		const browseLink = screen.getByRole("link", {
			name: /browse all tools/i,
		});
		expect(browseLink).toHaveAttribute("href", "/app/tools");
	});

	it("does not include disabled tools in suggestions", () => {
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		expect(screen.queryByText("Disabled Tool")).not.toBeInTheDocument();
	});

	it("shows credit cost for tools with creditCost > 0", () => {
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		// Contract analyzer has creditCost 10, should appear
		expect(screen.getByText("10 credits")).toBeInTheDocument();
	});

	it("renders null when no enabled related tools are found", () => {
		// speaker-separation's only category partner (diagram-editor) is not in mock registry
		// and the fallback loops over enabled tools excluding current — but with no fallback hits
		// this tests the null-return path
		const { container } = render(
			<RelatedToolsWidget currentToolSlug="speaker-separation" />,
		);
		// All related slugs (diagram-editor) are not in registry, relatedTools is empty → null
		expect(container.firstChild).toBeNull();
	});

	it("tracks click on related tool", async () => {
		mockTrack.mockClear();
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		const toolLinks = screen.getAllByRole("link");
		const relatedLink = toolLinks.find(
			(l) =>
				l.getAttribute("href") === "/app/tools/contract-analyzer" ||
				l.getAttribute("href") === "/app/tools/meeting-summarizer",
		);
		expect(relatedLink).toBeDefined();
		await userEvent.click(relatedLink!);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "related_tool_widget_clicked" }),
		);
	});

	it("tracks browse all tools click", async () => {
		mockTrack.mockClear();
		render(<RelatedToolsWidget currentToolSlug="news-analyzer" />);
		const browseLink = screen.getByRole("link", {
			name: /browse all tools/i,
		});
		await userEvent.click(browseLink);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "related_tool_browse_all_clicked",
			}),
		);
	});
});
