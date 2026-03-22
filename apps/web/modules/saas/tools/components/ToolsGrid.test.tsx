import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolsGrid } from "./ToolsGrid";

vi.mock("@saas/start/hooks/use-recent-jobs", () => ({
	useRecentJobs: () => ({ recentToolSlugs: [] }),
}));

vi.mock("@saas/tools/lib/tool-flags", () => ({
	getVisibleTools: () => [
		{
			slug: "news-analyzer",
			name: "News Analyzer",
			description: "Analyze news articles for bias and sentiment.",
			icon: "newspaper",
			public: false,
			enabled: true,
			creditCost: 2,
			isEnabled: true,
			isComingSoon: false,
		},
		{
			slug: "invoice-processor",
			name: "Invoice Processor",
			description: "Extract data from invoices automatically.",
			icon: "receipt",
			public: false,
			enabled: true,
			creditCost: 3,
			isEnabled: true,
			isComingSoon: false,
		},
		{
			slug: "bg-remover",
			name: "Background Remover",
			description: "Remove image backgrounds with AI.",
			icon: "image-minus",
			public: false,
			enabled: false,
			creditCost: 1,
			isEnabled: false,
			isComingSoon: true,
		},
		{
			slug: "contract-analyzer",
			name: "Contract Analyzer",
			description: "Surface key terms and risk clauses from contracts.",
			icon: "file-text",
			public: false,
			enabled: true,
			creditCost: 4,
			isEnabled: true,
			isComingSoon: false,
		},
		{
			slug: "meeting-summarizer",
			name: "Meeting Summarizer",
			description: "Get structured summaries from meeting notes.",
			icon: "clipboard-list",
			public: false,
			enabled: true,
			creditCost: 2,
			isEnabled: true,
			isComingSoon: false,
		},
	],
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

describe("ToolsGrid", () => {
	it("renders all visible tools", () => {
		render(<ToolsGrid />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Background Remover")).toBeInTheDocument();
	});

	it("shows search bar when tool count > 4", () => {
		render(<ToolsGrid />);
		expect(
			screen.getByPlaceholderText("Search tools…"),
		).toBeInTheDocument();
	});

	it("shows sort selector when tool count > 4", () => {
		render(<ToolsGrid />);
		expect(screen.getByLabelText("Sort tools")).toBeInTheDocument();
	});

	it("filters tools by name", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "invoice");
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.queryByText("News Analyzer")).not.toBeInTheDocument();
	});

	it("filters tools by description", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "sentiment");
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.queryByText("Invoice Processor")).not.toBeInTheDocument();
	});

	it("shows empty state when no tools match search", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "zzz-not-a-tool");
		expect(screen.getByText("No tools found")).toBeInTheDocument();
		expect(
			screen.getByText("Try a different search term or category."),
		).toBeInTheDocument();
	});

	it("search is case-insensitive", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "NEWS");
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});

	it("renders sort selector with default option shown", () => {
		render(<ToolsGrid />);
		// The select trigger shows the current value; default order text should be present
		expect(screen.getByLabelText("Sort tools")).toBeInTheDocument();
	});

	it("renders category filter buttons", () => {
		render(<ToolsGrid />);
		// All category pills should be rendered (group has aria-label)
		expect(
			screen.getByRole("group", { name: "Filter by category" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
	});

	it("filters tools by category", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		// Click "Finance" category which maps to invoice-processor
		const financeBtn = screen.getByRole("button", { name: "Finance" });
		await user.click(financeBtn);
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.queryByText("News Analyzer")).not.toBeInTheDocument();
	});

	it("shows 'Show all tools' button in empty category state", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		// Search for something that won't match any tool in the category
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "zzz-not-a-tool");
		// click a category
		const financeBtn = screen.getByRole("button", { name: "Finance" });
		await user.click(financeBtn);
		expect(
			screen.getByRole("button", { name: "Show all tools" }),
		).toBeInTheDocument();
	});
});
