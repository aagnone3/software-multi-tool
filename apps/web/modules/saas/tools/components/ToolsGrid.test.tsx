import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolsGrid } from "./ToolsGrid";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/start/hooks/use-recent-jobs", () => ({
	useRecentJobs: () => ({ recentToolSlugs: [], recentToolsMap: new Map() }),
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
	beforeEach(() => {
		localStorage.clear();
	});
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

	it("shows recent searches dropdown when input is focused with prior searches", async () => {
		// Pre-seed localStorage with a recent search
		localStorage.setItem(
			"tools-grid-recent-searches",
			JSON.stringify(["invoice"]),
		);
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.click(search);
		expect(screen.getByText("Recent searches")).toBeInTheDocument();
		expect(screen.getByText("invoice")).toBeInTheDocument();
	});

	it("applies a recent search when clicked", async () => {
		localStorage.setItem(
			"tools-grid-recent-searches",
			JSON.stringify(["invoice"]),
		);
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.click(search);
		const recentEntry = screen.getByText("invoice");
		await user.click(recentEntry);
		// Search should now show only Invoice Processor
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.queryByText("News Analyzer")).not.toBeInTheDocument();
	});

	it("removes a recent search when X button is clicked", async () => {
		localStorage.setItem(
			"tools-grid-recent-searches",
			JSON.stringify(["invoice"]),
		);
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.click(search);
		expect(screen.getByText("invoice")).toBeInTheDocument();
		const removeBtn = screen.getByRole("button", {
			name: 'Remove "invoice" from recent searches',
		});
		await user.click(removeBtn);
		expect(screen.queryByText("invoice")).not.toBeInTheDocument();
	});

	it("tracks tools_grid_searched on search blur with query", async () => {
		mockTrack.mockClear();
		const user = userEvent.setup({ delay: null });
		render(<ToolsGrid />);
		const search = screen.getByPlaceholderText("Search tools…");
		await user.type(search, "invoice");
		await user.tab();
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tools_grid_searched",
			props: { query: "invoice" },
		});
	});
});
